import {Component, computed, inject, Signal, signal, WritableSignal} from '@angular/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ToastModule} from 'primeng/toast';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {email, form, FormField, pattern, required} from '@angular/forms/signals';
import {WebcamImage, WebcamModule} from 'ngx-webcam';
import {CommonModule} from '@angular/common';
import {firstValueFrom, Observable, Subject} from 'rxjs';
import {RegisterSubjectData} from '../../dtos/register-subject-data';
import {ConsentManagerService} from '../../services/consent-management.service';
import {DeviceData} from '../../dtos/device-data';
import {SubjectFromData} from '../../dtos/subject-from-data';
import {Dialog} from 'primeng/dialog';
import {Tag} from 'primeng/tag';
import {Divider} from 'primeng/divider';
import {TableModule} from 'primeng/table';
import {ProgressSpinner} from 'primeng/progressspinner';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-manage-consent',
  imports: [
    CommonModule, WebcamModule, FormField,
    ButtonModule, InputTextModule, CardModule,
    ToastModule, SelectButtonModule, Dialog, Tag, Divider, TableModule, ProgressSpinner, ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manage-consent.html',
})
export class ManageConsent {
  readonly messageService = inject(MessageService);
  readonly confirmationService = inject(ConfirmationService);
  readonly consentManagementService = inject(ConsentManagerService);

  subjectModel: WritableSignal<SubjectFromData> = signal<SubjectFromData>({
    identification: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    subjectType: 'PERSONA',
    contactPerson: '',
  });

  subjectForm = form(this.subjectModel, (s) => {
    required(s.identification, {message: 'Identificación requerida'});
    required(s.fullName, {message: 'Nombre requerido'});
    required(s.email, {message: 'Email requerido'});
    email(s.email, {message: 'Email inválido'});
    pattern(s.identification, /^[0-9]+$/, {message: 'Solo números'});
    pattern(s.phone, /^[0-9]*$/, {message: 'Solo números'});
  });
  isEmpresa: Signal<boolean> = computed(() => this.subjectModel().subjectType === 'EMPRESA');
  devices: WritableSignal<DeviceData[]> = signal<DeviceData[]>([]);
  showDeviceDialog: WritableSignal<boolean> = signal(false);
  editingIndex: WritableSignal<number | null> = signal<number | null>(null);
  currentDevice: WritableSignal<DeviceData> = signal<DeviceData>(this.emptyDevice());

  private emptyDevice(): DeviceData {
    return {deviceType: '', brand: '', model: '', serialNumber: '', systemUser: '', password: ''};
  }

  openAddDevice(): void {
    this.currentDevice.set(this.emptyDevice());
    this.editingIndex.set(null);
    this.showDeviceDialog.set(true);
  }

  openEditDevice(index: number): void {
    this.currentDevice.set({...this.devices()[index]});
    this.editingIndex.set(index);
    this.showDeviceDialog.set(true);
  }

  removeDevice(index: number): void {
    this.devices.update(list => list.filter((_, i) => i !== index));
  }

  saveDevice(): void {
    const dev = this.currentDevice();
    if (!dev.deviceType || !dev.serialNumber || !dev.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Tipo, serie y contraseña son obligatorios'
      });
      return;
    }
    if (dev.password.length < 8) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contraseña débil',
        detail: 'Mínimo 8 caracteres'
      });
      return;
    }

    const idx: number | null = this.editingIndex();
    if (idx !== null) {
      this.devices.update(list => {
        const updated = [...list];
        updated[idx] = {...dev};
        return updated;
      });
    } else {
      this.devices.update(list => [...list, {...dev}]);
    }
    this.showDeviceDialog.set(false);
  }

  updateDeviceField(field: keyof DeviceData, value: string): void {
    this.currentDevice.update(d => ({...d, [field]: value}));
  }

  imagePreview: WritableSignal<string | null> = signal<string | null>(null);
  biometricBase64: WritableSignal<string> = signal<string>('');
  isCameraActive: WritableSignal<boolean> = signal(false);
  private trigger: Subject<void> = new Subject<void>();

  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  takeSnapshot(): void {
    this.trigger.next();
  }

  handleImage(webcamImage: WebcamImage): void {
    const base64: string = webcamImage.imageAsBase64;
    this.biometricBase64.set(base64);
    this.imagePreview.set(webcamImage.imageAsDataUrl);
    this.isCameraActive.set(false);
  }

  toggleCamera(): void {
    this.isCameraActive.update(v => !v);
  }

  resetCapture(): void {
    this.imagePreview.set(null);
    this.biometricBase64.set('');
    this.isCameraActive.set(true);
  }

  loading: WritableSignal<boolean> = signal(false);

  validations(): void {

  }

  private validateForm(): boolean {
    if (this.subjectForm().invalid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Revise los campos obligatorios'
      });
      return false;
    }

    if (this.devices().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin dispositivos',
        detail: 'Agregue al menos un dispositivo'
      });
      return false;
    }

    if (!this.biometricBase64()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Biométrico requerido',
        detail: 'Debe capturar la imagen facial'
      });
      return false;
    }

    return true;
  }

  private buildPayload(): RegisterSubjectData {
    return {
      ...this.subjectModel(),
      contactPerson: this.isEmpresa() ? this.subjectModel().contactPerson : '',
      devices: this.devices(),
      biometricImageBase64: this.biometricBase64(),
      consentText: 'Autorización por registro facial',
      templateType: 'ARCFACE_512',
      digitalSignature: '',
    };
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.validateForm()) {
      return
    }
    ;
    const payload = this.buildPayload();
    try {
      this.loading.set(true);
      await firstValueFrom(this.consentManagementService.saveSubject(payload));
      this.confirmationService.confirm({
        header: 'Registro Exitoso',
        message: 'El titular, dispositivos y datos biométricos fueron registrados correctamente.',
        icon: 'pi pi-check-circle',
        acceptLabel: 'Aceptar',
        rejectVisible: false,
        accept: () => this.resetForm(),
      });
    } catch (err: unknown) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  resetForm(): void {
    this.subjectModel.set({
      identification: '', fullName: '', email: '', phone: '',
      address: '', subjectType: 'PERSONA', contactPerson: '',
    });
    this.devices.set([]);
    this.imagePreview.set(null);
    this.biometricBase64.set('');
    this.isCameraActive.set(false);
  }
}
