import { CommonModule } from "@angular/common";
import {Component, inject, OnInit, signal, WritableSignal} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import {DividerModule} from 'primeng/divider';
import {BadgeModule} from 'primeng/badge';
import {SkeletonModule} from 'primeng/skeleton';
import {MessageService} from 'primeng/api';
import {DashboardService} from '../../services/dashboard.service';
import {ImmutableAuditPageDto} from '../../dtos/dashboard-management/immutable-audit-page-dto';
import {firstValueFrom} from 'rxjs';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, TableModule, TagModule, ButtonModule, InputTextModule,
    ToastModule, TooltipModule, DividerModule,
    SkeletonModule, BadgeModule, Select, DatePicker
  ],
  providers: [MessageService],
  templateUrl: './audit-log.html',
})
export class AuditLog implements OnInit {
  private readonly svc = inject(DashboardService);
  readonly msg = inject(MessageService);

  loading: WritableSignal<boolean> = signal(false);
  result: WritableSignal<ImmutableAuditPageDto | null> = signal(null);

  // filters
  filterAction = '';
  filterFrom: Date | null = null;
  filterTo: Date | null = null;
  page = 1;
  pageSize = 20;

  readonly actionOptions = [
    {label: 'Todos', value: ''},
    {label: 'Creado', value: 'CREADO'},
    {label: 'Actualizado', value: 'ACTUALIZADO'},
    {label: 'Completado', value: 'COMPLETADO'},
    {label: 'Rechazado', value: 'RECHAZADO'},
    {label: 'En proceso', value: 'EN_PROCESO'},
  ];

  expandedRows: Record<string, boolean> = {};

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const from = this.filterFrom ? this.filterFrom.toISOString() : undefined;
      const to   = this.filterTo   ? this.filterTo.toISOString()   : undefined;
      const data = await firstValueFrom(
        this.svc.getAuditLog(this.page, this.pageSize, this.filterAction || undefined, from, to)
      );
      this.result.set(data);
    } catch {
      this.msg.add({severity: 'error', summary: 'Error', detail: 'No se pudo cargar el log de auditoría'});
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    this.page = 1;
    this.load();
  }

  clearFilters() {
    this.filterAction = '';
    this.filterFrom = null;
    this.filterTo = null;
    this.page = 1;
    this.load();
  }

  goToPage(p: number) {
    this.page = p;
    this.load();
  }

  get totalPages(): number {
    return Math.ceil((this.result()?.totalCount ?? 0) / this.pageSize);
  }

  copyHash(hash: string) {
    navigator.clipboard.writeText(hash).catch(() => {});
    this.msg.add({severity: 'info', summary: 'Copiado', detail: 'Hash copiado al portapapeles', life: 2000});
  }

  actionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | undefined {
    switch (action) {
      case 'CREADO':      return 'info';
      case 'COMPLETADO':  return 'success';
      case 'RECHAZADO':   return 'danger';
      case 'EN_PROCESO':  return 'warn';
      default:            return undefined;
    }
  }

  toggleRow(id: string) {
    this.expandedRows[id] = !this.expandedRows[id];
  }
}
