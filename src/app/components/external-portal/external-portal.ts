import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {ToastModule} from 'primeng/toast';
import {InputTextModule} from 'primeng/inputtext';
import {Tag} from 'primeng/tag';
import {Divider} from 'primeng/divider';
import {ProgressSpinner} from 'primeng/progressspinner';
import {TableModule} from 'primeng/table';
import {Message} from 'primeng/message';
import {MessageService} from 'primeng/api';
import {PartContractService} from '../../services/part-contract.service';
import {FIELD_LABELS} from '../../enums/part-fields';

type ExternalStep = 'search' | 'loading' | 'data' | 'error';

@Component({
  selector: 'app-external-portal',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, ToastModule, InputTextModule,
    Tag, Divider, ProgressSpinner, TableModule, Message
  ],
  providers: [MessageService],
  templateUrl: './external-portal.html'
})
export class ExternalPortal implements OnInit {

  private readonly svc = inject(PartContractService);
  readonly messageService = inject(MessageService);

  step: WritableSignal<ExternalStep> = signal('search');
  searchId: WritableSignal<string> = signal('');
  subjectData: WritableSignal<Record<string, any> | null> = signal(null);
  errorMsg: WritableSignal<string> = signal('');
  loading: WritableSignal<boolean> = signal(false);
  fieldLabels = FIELD_LABELS;

  searchHistory: WritableSignal<string[]> = signal([]);

  ngOnInit() {
  }

  search() {
    const id = this.searchId().trim();
    if (!id) return;

    this.loading.set(true);
    this.step.set('loading');
    this.subjectData.set(null);
    this.errorMsg.set('');

    this.svc.getExternalSubjectData(this.searchId()).subscribe({
      next: data => {
        this.subjectData.set(data);
        this.step.set('data');
        this.loading.set(false);
        const h = this.searchHistory();
        if (!h.includes(id)) this.searchHistory.set([id, ...h].slice(0, 5));
      },
      error: err => {
        const msg = err.status === 401 || err.status === 403
          ? 'No tiene acceso a estos datos o su contrato ha vencido.'
          : err.status === 404
            ? 'Titular no encontrado.'
            : err.error?.detail ?? 'Error al consultar los datos.';
        this.errorMsg.set(msg);
        this.step.set('error');
        this.loading.set(false);
      }
    });
  }

  reset() {
    this.step.set('search');
    this.searchId.set('');
    this.subjectData.set(null);
    this.errorMsg.set('');
  }

  searchFromHistory(id: string) {
    this.searchId.set(id);
    this.search();
  }

  getDataEntries(): { key: string; label: string; value: any }[] {
    const data = this.subjectData();
    if (!data) return [];
    return Object.entries(data)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => ({
        key: k,
        label: this.fieldLabels[k] ?? k,
        value: v
      }));
  }

  isDevicesField(key: string): boolean {
    return key === 'devices';
  }

  formatValue(value: any): string {
    if (Array.isArray(value)) return '';
    return String(value ?? '—');
  }
}
