import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {FIELD_LABELS} from '../../enums/part-fields';
import {PartContractService} from '../../services/part-contract.service';
import {PartContractDto} from '../../dtos/part-management/part-contract-dto';
import {Button} from 'primeng/button';
import {Toolbar} from 'primeng/toolbar';
import {Toast} from 'primeng/toast';
import {Card} from 'primeng/card';
import {Select} from 'primeng/select';
import {ProgressSpinner} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {Tag} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {MessageService} from 'primeng/api';
import {Dialog} from 'primeng/dialog';
import {DatePicker} from 'primeng/datepicker';

@Component({
  selector: 'app-part-contracts-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    Button, Toolbar, Toast, Card, Select,
    ProgressSpinner, TableModule, Tag, TooltipModule, Dialog, DatePicker
  ],
  providers: [MessageService],
  templateUrl: './part-contracts-list.html'
})
export class PartContractsList implements OnInit {
  renewMode: WritableSignal<boolean> = signal(false);
  renewTarget: WritableSignal<PartContractDto | null> = signal<PartContractDto | null>(null);
  renewFrom: WritableSignal<Date> = signal<Date>(new Date());
  renewUntil: WritableSignal<Date> = signal<Date>(new Date(Date.now() + 365 * 86400000));
  renewing: WritableSignal<boolean> = signal(false);
  contracts: WritableSignal<PartContractDto[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  statusFilter: WritableSignal<string> = signal('');
  fieldLabels:Record<string, string> = FIELD_LABELS;

  readonly statusOptions = [
    {label: 'Todos los estados', value: ''},
    {label: 'Activo', value: 'ACTIVO'},
    {label: 'Suspendido', value: 'SUSPENDIDO'},
    {label: 'Revocado', value: 'REVOCADO'},
    {label: 'Vencido', value: 'VENCIDO'}
  ];

  svc = inject(PartContractService);
  messageService = inject(MessageService);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.statusFilter() || undefined).subscribe({
      next: data => {
        this.contracts.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los contratos.'
        });
      }
    });
  }
  openRenew(c: PartContractDto) {
    this.renewTarget.set(c);
    this.renewFrom.set(new Date());
    this.renewUntil.set(new Date(Date.now() + 365 * 86400000));
    this.renewMode.set(true);
  }

  confirmRenew() {
    const target = this.renewTarget();
    if (!target) {return;}
    this.renewing.set(true);
    this.svc.renew(target.id, {
      validFrom:  this.renewFrom().toISOString(),
      validUntil: this.renewUntil().toISOString()
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success', summary: 'Contrato renovado',
          detail: 'Se creó un nuevo contrato y se enviaron las credenciales.'
        });
        this.renewMode.set(false);
        this.renewing.set(false);
        this.load();
      },
      error: () => {
        this.renewing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo renovar.' });
      }
    });
  }
  downloadPdf(id: string, companyName: string) {
    this.svc.downloadPdf(id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${companyName.replace(/ /g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      ACTIVO: 'success', SUSPENDIDO: 'warn', REVOCADO: 'danger', VENCIDO: 'secondary'
    };
    return map[status] ?? 'secondary';
  }

  fieldsLabel(fields: string[]): string {
    return fields.map(f => this.fieldLabels[f] ?? f).join(', ');
  }
}
