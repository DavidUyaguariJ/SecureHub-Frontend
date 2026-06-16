import {Component, computed, inject, signal, WritableSignal} from '@angular/core';
import {WebcamImage, WebcamModule} from 'ngx-webcam';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {ToastModule} from 'primeng/toast';
import {Divider} from 'primeng/divider';
import {Tag} from 'primeng/tag';
import {ProgressSpinner} from 'primeng/progressspinner';
import {TextareaModule} from 'primeng/textarea';
import {MessageService} from 'primeng/api';
import {ArcoService} from '../../../services/arco.service';
import {SubjectLookupDto} from '../../../dtos/arco-management/subject-lookup-dto';
import {firstValueFrom, Observable, Subject} from 'rxjs';
import {ArcoRequestType} from '../../../enums/arco-request-type';
import {UpdateSubjectDataDto} from '../../../dtos/arco-management/update-subject-data-dto';
import {CreateArcoRequestDto} from '../../../dtos/arco-management/create-arco-request-dto';
import {CommonModule} from '@angular/common';
import {ArcoStep, REQUEST_TYPE_ICONS, REQUEST_TYPE_LABELS} from '../../../enums/const-types';
import {ArcoRequestResponseDto} from '../../../dtos/arco-management/arco-request-response-dto';
import {UpdateDeviceDto} from '../../../dtos/arco-management/update-device-dto';


@Component({
  selector: 'app-arco-request',
  standalone: true,
  imports: [
    CommonModule,
    WebcamModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    Divider,
    Tag,
    ProgressSpinner,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './arco-request.html',
})
export class ArcoRequest {
  private readonly arcoService = inject(ArcoService);
  readonly messageService = inject(MessageService);
  deviceUpdates: WritableSignal<UpdateDeviceDto[]> = signal([]);
  step: WritableSignal<ArcoStep> = signal('lookup');

  stepIndex = computed((): number => {
    const map: Record<ArcoStep, number> = {
      lookup: 0,
      verify: 1,
      form: 2,
      success: 3,
    };

    return map[this.step()];
  });

  identification: WritableSignal<string> = signal('');
  lookupLoading: WritableSignal<boolean> = signal(false);
  lookupError: WritableSignal<string> = signal('');
  foundSubject: WritableSignal<SubjectLookupDto | null> = signal(null);

  private webcamTrigger = new Subject<void>();

  get triggerObservable(): Observable<void> {
    return this.webcamTrigger.asObservable();
  }

  cameraActive: WritableSignal<boolean> = signal(false);
  imagePreview: WritableSignal<string | null> = signal(null);
  biometricBase64: WritableSignal<string> = signal('');

  selectedType: WritableSignal<ArcoRequestType> =
    signal<ArcoRequestType>('ACCESO');

  description: WritableSignal<string> = signal('');

  updateData: WritableSignal<UpdateSubjectDataDto> = signal({});

  submitLoading: WritableSignal<boolean> = signal(false);

  createdId: WritableSignal<string> = signal('');

  showUpdateForm = computed(
    (): boolean => this.selectedType() === 'RECTIFICACION'
  );

  showCancelWarn = computed(
    (): boolean => this.selectedType() === 'CANCELACION'
  );

  readonly REQUEST_TYPE_LABELS = REQUEST_TYPE_LABELS;
  readonly REQUEST_TYPE_ICONS = REQUEST_TYPE_ICONS;

  readonly typeOptions = Object.keys(
    REQUEST_TYPE_LABELS
  ) as ArcoRequestType[];

  addDeviceUpdate(): void {
    const newDev: UpdateDeviceDto = { id: '', brand: '', model: '', serialNumber: '' };
    this.deviceUpdates.update(list => [...list, newDev]);
  }

  removeDeviceUpdate(index: number): void {
    this.deviceUpdates.update(list => list.filter((_, i) => i !== index));
  }

  setDeviceUpdateField(
    index: number,
    field: keyof UpdateDeviceDto,
    value: string
  ): void {
    this.deviceUpdates.update(list => {
      const updated = [...list];
      updated[index] = { ...updated[index], [field]: value || undefined };
      return updated;
    });
  }

  async onLookup(): Promise<void> {
    const id = this.identification().trim();

    if (!id) {
      return;
    }

    this.lookupLoading.set(true);
    this.lookupError.set('');

    try {
      const subject = await firstValueFrom(
        this.arcoService.lookupSubject(id)
      );

      this.foundSubject.set(subject);

      if (!subject.hasBiometrics) {
        this.lookupError.set(
          'El titular no tiene biometría registrada. No puede presentar solicitudes ARCO.'
        );

        return;
      }

      this.step.set('verify');
      this.cameraActive.set(true);
    } catch (err: unknown) {
      const e = err as {
        error?: { message?: string };
        status?: number;
      };

      this.lookupError.set(
        e?.error?.message ??
        (e?.status === 404
          ? 'No se encontró ningún titular con esa identificación.'
          : 'Error al consultar. Intente nuevamente.')
      );
    } finally {
      this.lookupLoading.set(false);
    }
  }

  takeSnapshot(): void {
    this.webcamTrigger.next();
  }

  handleImage(img: WebcamImage): void {
    this.biometricBase64.set(img.imageAsBase64);
    this.imagePreview.set(img.imageAsDataUrl);
    this.cameraActive.set(false);
  }

  retake(): void {
    this.imagePreview.set(null);
    this.biometricBase64.set('');
    this.cameraActive.set(true);
  }

  confirmAndContinue(): void {
    this.step.set('form');
  }

  setUpdateField(
    field: keyof UpdateSubjectDataDto,
    value: string
  ): void {
    this.updateData.update((d) => ({
      ...d,
      [field]: value || undefined,
    }));
  }

  private buildCreateDto(subject: SubjectLookupDto): CreateArcoRequestDto {
    return {
      subjectId:   subject.id,
      requestType: this.selectedType(),
      description: this.description() || undefined,
      imageBase64: this.biometricBase64(),
      updatedData: this.showUpdateForm()
        ? {
          ...this.updateData(),
          devices: this.deviceUpdates().filter(d => d.id.trim())
        }
        : undefined,
    };
  }

  private getSubmitErrorMessage(
    e: {
      error?: { message?: string };
      status?: number;
    }
  ): string {
    if (e?.error?.message) {
      return e.error.message;
    }

    if (e?.status === 401) {
      return 'Verificación biométrica fallida. Intente nuevamente.';
    }

    return 'Error al enviar la solicitud.';
  }

  async onSubmit(): Promise<void> {
    const subject = this.foundSubject();

    if (!subject || !this.biometricBase64()) {
      return;
    }

    const dto = this.buildCreateDto(subject);

    this.submitLoading.set(true);

    try {
      const res: ArcoRequestResponseDto =
        await firstValueFrom(
          this.arcoService.createRequest(dto)
        );

      this.createdId.set(res.id);
      this.step.set('success');
    } catch (err: unknown) {
      const message = this.getSubmitErrorMessage(
        err as {
          error?: { message?: string };
          status?: number;
        }
      );

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 7000,
      });
    } finally {
      this.submitLoading.set(false);
    }
  }

  goBack(to: ArcoStep): void {
    if (to === 'lookup') {
      this.foundSubject.set(null);
      this.lookupError.set('');
    }

    if (to === 'verify') {
      this.retake();
    }

    this.step.set(to);
  }

  reset(): void {
    this.step.set('lookup');
    this.identification.set('');
    this.foundSubject.set(null);
    this.lookupError.set('');
    this.imagePreview.set(null);
    this.biometricBase64.set('');
    this.cameraActive.set(false);
    this.selectedType.set('ACCESO');
    this.description.set('');
    this.updateData.set({});
    this.createdId.set('');
    this.deviceUpdates.set([]);
  }
}
