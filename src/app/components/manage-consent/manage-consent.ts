import {Component, computed, inject, Signal, signal, WritableSignal} from '@angular/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ToastModule} from 'primeng/toast';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {email, form, FormField, pattern, required} from '@angular/forms/signals';
import {CommonModule} from '@angular/common';
import {firstValueFrom} from 'rxjs';
import {RegisterSubjectData} from '../../dtos/subject-management/register-subject-data';
import {ConsentManagerService} from '../../services/consent-management.service';
import {DeviceData} from '../../dtos/subject-management/device-data';
import {SubjectFromData} from '../../dtos/subject-management/subject-from-data';
import {Dialog} from 'primeng/dialog';
import {Divider} from 'primeng/divider';
import {TableModule} from 'primeng/table';
import {ProgressSpinner} from 'primeng/progressspinner';
import {ConfirmDialog} from 'primeng/confirmdialog';

@Component({
  selector: 'app-manage-consent',
  imports: [
    CommonModule, FormField,
    ButtonModule, InputTextModule, CardModule,
    ToastModule, SelectButtonModule, Dialog, Divider, TableModule, ProgressSpinner, ConfirmDialog
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

  devices: WritableSignal<DeviceData[]>          = signal<DeviceData[]>([]);
  showDeviceDialog: WritableSignal<boolean>       = signal(false);
  editingIndex: WritableSignal<number | null>     = signal<number | null>(null);
  currentDevice: WritableSignal<DeviceData>       = signal<DeviceData>(this.emptyDevice());
  loading: WritableSignal<boolean>               = signal(false);

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
      this.messageService.add({severity: 'warn', summary: 'Campos requeridos', detail: 'Tipo, serie y contraseña son obligatorios'});
      return;
    }
    if (dev.password.length < 8) {
      this.messageService.add({severity: 'warn', summary: 'Contraseña débil', detail: 'Mínimo 8 caracteres'});
      return;
    }
    const idx: number | null = this.editingIndex();
    if (idx !== null) {
      this.devices.update(list => { const updated = [...list]; updated[idx] = {...dev}; return updated; });
    } else {
      this.devices.update(list => [...list, {...dev}]);
    }
    this.showDeviceDialog.set(false);
  }

  updateDeviceField(field: keyof DeviceData, value: string): void {
    this.currentDevice.update(d => ({...d, [field]: value}));
  }

  private validateForm(): boolean {
    if (this.subjectForm().invalid()) {
      this.messageService.add({severity: 'warn', summary: 'Formulario incompleto', detail: 'Revise los campos obligatorios'});
      return false;
    }
    if (this.devices().length === 0) {
      this.messageService.add({severity: 'warn', summary: 'Sin dispositivos', detail: 'Agregue al menos un dispositivo'});
      return false;
    }
    return true;
  }

  private buildPayload(): RegisterSubjectData {
    return {
      ...this.subjectModel(),
      contactPerson: this.isEmpresa() ? this.subjectModel().contactPerson : '',
      devices: this.devices(),
    };
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.validateForm()) { return; }
    const payload = this.buildPayload();
    try {
      this.loading.set(true);
      await firstValueFrom(this.consentManagementService.saveSubject(payload));
      this.confirmationService.confirm({
        header: 'Registro Exitoso',
        message: 'El titular y sus dispositivos fueron registrados. Se enviaron las credenciales de acceso al correo registrado.',
        icon: 'pi pi-check-circle',
        acceptLabel: 'Aceptar',
        rejectVisible: false,
        accept: () => this.resetForm(),
      });
    } catch (err: unknown) {
      const e = err as {error?: {message?: string}};
      this.messageService.add({severity: 'error', summary: 'Error', detail: e?.error?.message ?? 'Error al registrar el titular.'});
    } finally {
      this.loading.set(false);
    }
  }

  resetForm(): void {
    this.subjectModel.set({identification: '', fullName: '', email: '', phone: '', address: '', subjectType: 'PERSONA', contactPerson: ''});
    this.devices.set([]);
  }
}
