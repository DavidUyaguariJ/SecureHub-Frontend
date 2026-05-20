import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {WebcamImage, WebcamModule} from 'ngx-webcam';
import {firstValueFrom, Observable, Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

import {MessageService} from 'primeng/api';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {ToastModule} from 'primeng/toast';
import {InputTextModule} from 'primeng/inputtext';
import {Tag} from 'primeng/tag';
import {Divider} from 'primeng/divider';
import {ProgressSpinner} from 'primeng/progressspinner';

import {SubjectPortalService} from '../../services/subject-portal.service';
import {ArcoService} from '../../services/arco.service';
import {AuthService} from '../../security/auth.service';
import {SubjectPortalDto} from '../../dtos/arco-management/subject-portal-dto';
import {SubjectLookupDto} from '../../dtos/arco-management/subject-lookup-dto';

type PortalStep = 'lookup' | 'loading' | 'first-time' | 'register-biometric' | 'verify-biometric' | 'data';

@Component({
  selector: 'app-subject-portal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, WebcamModule,
    CardModule, ButtonModule, ToastModule, InputTextModule,
    Tag, Divider, ProgressSpinner,
  ],
  providers: [MessageService],
  templateUrl: './subject-portal.html',
})
export class SubjectPortal implements OnInit {

  private readonly service     = inject(SubjectPortalService);
  private readonly arcoService = inject(ArcoService);
  private readonly authService = inject(AuthService);
  private readonly route       = inject(ActivatedRoute);
  readonly messageService      = inject(MessageService);

  step: WritableSignal<PortalStep>                    = signal('loading');
  subjectId: WritableSignal<string>                   = signal('');
  identification: WritableSignal<string>              = signal('');
  subjectLookup: WritableSignal<SubjectLookupDto | null> = signal(null);
  subjectData: WritableSignal<SubjectPortalDto | null>   = signal(null);
  loading: WritableSignal<boolean>                    = signal(false);

  private webcamTrigger                               = new Subject<void>();
  get triggerObservable(): Observable<void>           { return this.webcamTrigger.asObservable(); }
  cameraActive: WritableSignal<boolean>               = signal(false);
  imagePreview: WritableSignal<string | null>         = signal(null);
  imageBase64: WritableSignal<string>                 = signal('');

  readonly consentText = 'Autorizo el tratamiento de mis datos biométricos faciales ' +
    'conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).';

  isAdmin(): boolean {
    return this.authService.hasAnyRole(['admin_role', 'admin_api_role']);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT: detectar si viene con ?subjectId= en la URL (link del correo)
  // Si es admin sin subjectId → buscador
  // Si viene con subjectId   → cargar y evaluar si es primera vez
  // ─────────────────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    const paramId = this.route.snapshot.queryParamMap.get('subjectId');

    if (paramId) {
      this.subjectId.set(paramId);
      await this.loadSubjectAndDecide(paramId);
    } else if (this.isAdmin()) {
      // Admin sin subjectId → mostrar buscador
      this.step.set('lookup');
    } else {
      this.step.set('lookup');
    }
  }

  private async loadSubjectAndDecide(subjectId: string): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.service.getMyData(subjectId));
      this.subjectData.set(data);

      if (!data.hasBiometrics) {
        this.step.set('first-time');
      } else {
        this.step.set('verify-biometric');
      }
    } catch {
      this.messageService.add({
        severity: 'error', summary: 'Error',
        detail: 'No se pudo cargar el perfil. Verifique el enlace o intente buscar por identificación.',
      });
      this.step.set('lookup');
    } finally {
      this.loading.set(false);
    }
  }

  async searchSubject(): Promise<void> {
    const id = this.identification().trim();
    if (!id) {
      this.messageService.add({severity: 'warn', summary: 'Campo requerido', detail: 'Ingrese una identificación.'});
      return;
    }

    this.loading.set(true);
    try {
      const lookup = await firstValueFrom(this.arcoService.lookupSubject(id));
      this.subjectLookup.set(lookup);
      this.subjectId.set(lookup.id);

      const data = await firstValueFrom(this.service.getMyData(lookup.id));
      this.subjectData.set(data);

      this.step.set(data.hasBiometrics ? 'verify-biometric' : 'first-time');
    } catch {
      this.messageService.add({
        severity: 'error', summary: 'No encontrado',
        detail: 'No existe un titular registrado con esa identificación.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  openCamera(): void {
    this.imagePreview.set(null);
    this.imageBase64.set('');
    this.cameraActive.set(true);
  }

  takeSnapshot(): void { this.webcamTrigger.next(); }

  handleImage(img: WebcamImage): void {
    this.imageBase64.set(img.imageAsBase64);
    this.imagePreview.set(img.imageAsDataUrl);
    this.cameraActive.set(false);
  }

  retake(): void {
    this.imagePreview.set(null);
    this.imageBase64.set('');
    this.cameraActive.set(true);
  }

  async registerBiometric(): Promise<void> {
    if (!this.imageBase64()) { return; }
    this.loading.set(true);
    try {
      await firstValueFrom(this.service.registerBiometric(this.subjectId(), {
        imageBase64: this.imageBase64(),
        consentText: this.consentText,
      }));

      this.messageService.add({severity: 'success', summary: 'Biometría registrada', detail: 'Registro exitoso.'});
      const data = await firstValueFrom(this.service.getMyData(this.subjectId()));
      this.subjectData.set(data);
      this.step.set('data');
    } catch (err: unknown) {
      const e = err as {error?: {message?: string}};
      this.messageService.add({severity: 'error', summary: 'Error', detail: e?.error?.message ?? 'No se pudo registrar la biometría.'});
    } finally {
      this.loading.set(false);
    }
  }

  async verifyBiometric(): Promise<void> {
    if (!this.imageBase64()) { return; }
    this.loading.set(true);
    try {
      const result = await firstValueFrom(this.service.verifyBiometric(this.subjectId(), {imageBase64: this.imageBase64()}));
      if (result.verified) {
        this.messageService.add({severity: 'success', summary: 'Verificado', detail: 'Identidad validada exitosamente.'});
        this.step.set('data');
      }
    } catch {
      this.messageService.add({severity: 'error', summary: 'Verificación fallida', detail: 'No se pudo validar la identidad. Intente nuevamente.'});
    } finally {
      this.loading.set(false);
    }
  }

  maskName(name: string): string {
    return name.split(' ').map(p => p.length <= 1 ? 'X' : p[0] + 'x'.repeat(p.length - 1)).join(' ');
  }

  maskEmail(email: string): string {
    const i = email.indexOf('@');
    if (i <= 0) { return '***@***'; }
    return email[0] + '*'.repeat(Math.max(i - 1, 1)) + email.slice(i);
  }

  maskPhone(phone: string | undefined): string {
    if (!phone) { return '—'; }
    return phone.length <= 4 ? '*'.repeat(phone.length) : '*'.repeat(phone.length - 4) + phone.slice(-4);
  }
}
