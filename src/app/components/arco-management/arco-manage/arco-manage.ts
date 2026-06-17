import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {DialogModule} from "primeng/dialog";
import {ToastModule} from "primeng/toast";
import {Divider} from "primeng/divider";
import {ProgressSpinner} from "primeng/progressspinner";
import {TimelineModule} from 'primeng/timeline';
import {TextareaModule} from 'primeng/textarea';
import {InputTextModule} from 'primeng/inputtext';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ArcoService} from '../../../services/arco.service';
import {ArcoRequestResponseDto} from '../../../dtos/arco-management/arco-request-response-dto';
import {ArcoRequestDetailDto} from '../../../dtos/arco-management/arco-request-detail-dto';
import {ArcoStatus} from '../../../enums/arco-status';
import {firstValueFrom} from 'rxjs';
import {ActionType, REQUEST_TYPE_LABELS, STATUS_LABELS, STATUS_SEVERITY} from '../../../enums/const-types';
import {UpdateArcoStatusDto} from '../../../dtos/arco-management/update-arco-status-dto';
import {ArcoRequestType} from '../../../enums/arco-request-type';
import {TooltipModule} from 'primeng/tooltip';


@Component({
  selector: 'app-arco-manage',
  standalone: true,
  imports: [
    CommonModule,
    CardModule, ButtonModule, TableModule, TagModule,
    DialogModule, ToastModule, Divider,
    ProgressSpinner, TimelineModule, TextareaModule, InputTextModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './arco-manage.html',
})
export class ArcoManage implements OnInit {
  readonly messageService: MessageService = inject(MessageService);
  readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly arcoService: ArcoService = inject(ArcoService);

  requests: WritableSignal<ArcoRequestResponseDto[]> = signal([]);
  listLoading: WritableSignal<boolean> = signal(false);
  statusFilter: WritableSignal<string> = signal('');
  detailVisible: WritableSignal<boolean> = signal(false);
  detailLoading: WritableSignal<boolean> = signal(false);
  selectedDetail: WritableSignal<ArcoRequestDetailDto | null> = signal(null);
  actionVisible: WritableSignal<boolean> = signal(false);
  actionType: WritableSignal<ActionType> = signal('approve');
  actionLoading: WritableSignal<boolean> = signal(false);
  responseText: WritableSignal<string> = signal('');
  rejectedReason: WritableSignal<string> = signal('');
  downloadLoading: WritableSignal<boolean> = signal(false);

  readonly statusOptions = [
    {label: 'Todas', value: ''},
    {label: 'Pendiente', value: 'PENDIENTE'},
    {label: 'En proceso', value: 'EN_PROCESO'},
    {label: 'Completado', value: 'COMPLETADO'},
    {label: 'Rechazado', value: 'RECHAZADO'},
  ];

  getRequestTypeLabel(type: string): string {
    return REQUEST_TYPE_LABELS[type as ArcoRequestType] ?? type;
  }

  getStatusLabel(status: string | undefined): string {
    return STATUS_LABELS[status as ArcoStatus] ?? (status ?? '');
  }

  getSeverity(status: string | undefined): 'warn' | 'info' | 'success' | 'danger' {
    return STATUS_SEVERITY[status as ArcoStatus] ?? 'info';
  }

  showProcessBtn(req: ArcoRequestResponseDto): boolean {
    return req.status === 'PENDIENTE';
  }

  showApproveRejectBtns(req: ArcoRequestResponseDto): boolean {
    return req.status === 'EN_PROCESO';
  }

  showDownloadBtn(req: ArcoRequestResponseDto): boolean {
    return req.status === 'COMPLETADO' || req.status === 'RECHAZADO';
  }

  isDuePassed(req: ArcoRequestResponseDto): boolean {
    if (!req.dueDate || req.status !== 'PENDIENTE') {
      return false;
    }
    return new Date(req.dueDate) < new Date();
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.listLoading.set(true);
    try {
      const data = await firstValueFrom(this.arcoService.getAll(this.statusFilter() || undefined));
      this.requests.set(data);
    } catch {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las solicitudes.'});
    } finally {
      this.listLoading.set(false);
    }
  }

  async openDetail(req: ArcoRequestResponseDto): Promise<void> {
    this.detailVisible.set(true);
    this.detailLoading.set(true);
    try {
      const detail = await firstValueFrom(this.arcoService.getDetail(req.id));
      this.selectedDetail.set(detail);
    } finally {
      this.detailLoading.set(false);
    }
  }

  openAction(type: ActionType): void {
    this.actionType.set(type);
    this.responseText.set('');
    this.rejectedReason.set('');
    this.actionVisible.set(true);
  }

  private getNewStatus(type: string): ArcoStatus {
    switch (type) {
      case 'approve':
        return 'COMPLETADO';
      case 'reject':
        return 'RECHAZADO';
      default:
        return 'EN_PROCESO';
    }
  }

  private buildDto(type: string, newStatus: ArcoStatus): UpdateArcoStatusDto {
    return {
      newStatus,
      responseText: type !== 'reject' ? (this.responseText() || undefined) : undefined,
      rejectedReason: type === 'reject' ? this.rejectedReason() : undefined,
      operatorRole: 'OPERADOR',
    };
  }

  private getSuccessLabel(type: string): string {
    switch (type) {
      case 'approve':
        return 'aprobada';
      case 'reject':
        return 'rechazada';
      default:
        return 'marcada en proceso';
    }
  }

  async confirmAction(): Promise<void> {
    const detail = this.selectedDetail();
    if (!detail) {return;}

    const type = this.actionType();
    const newStatus = this.getNewStatus(type);
    const dto = this.buildDto(type, newStatus);

    this.actionLoading.set(true);

    try {
      await firstValueFrom(this.arcoService.updateStatus(detail.request.id, dto));

      this.actionVisible.set(false);
      this.detailVisible.set(false);

      const label = this.getSuccessLabel(type);
      this.messageService.add({
        severity: 'success',
        summary: 'Listo',
        detail: `Solicitud ${label} correctamente.`,
      });

      await this.loadRequests();
    } finally {
      this.actionLoading.set(false);
    }
  }

  async downloadPdf(requestId: string): Promise<void> {
    this.downloadLoading.set(true);
    try {
      const blob = await firstValueFrom(this.arcoService.downloadResponse(requestId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respuesta-arco-${requestId.substring(0, 8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.messageService.add({severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF.'});
    } finally {
      this.downloadLoading.set(false);
    }
  }
}
