import {Component, inject, OnInit, signal, WritableSignal} from "@angular/core";
import {CommonModule} from '@angular/common';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {ChartModule} from 'primeng/chart';
import {ProgressBarModule} from 'primeng/progressbar';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';
import {DividerModule} from "primeng/divider";
import {ToastModule} from "primeng/toast";
import {TableModule} from "primeng/table";
import {RouterModule} from "@angular/router";
import {SkeletonModule} from 'primeng/skeleton';
import {TooltipModule} from 'primeng/tooltip';
import {MessageService} from 'primeng/api';
import { DashboardService } from "../../services/dashboard.service";
import {DashboardSummaryDto} from '../../dtos/dashboard-management/dashboard-summary-dto';
import {ArcoAlertDto} from '../../dtos/dashboard-management/arco-alert-dto';
import {ContractAlertDto} from '../../dtos/dashboard-management/contract-alert-dto';
import {REQUEST_TYPE_LABELS} from '../../enums/const-types';
import {firstValueFrom} from 'rxjs';
import {ArcoByTypeDto} from '../../dtos/dashboard-management/arco-by-type-dto';
import {ArcoMonthlyTrendDto} from '../../dtos/dashboard-management/arco-monthly-trend-dto';
import {downloadBlob} from '../../commons/download-blob';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CardModule, TagModule, BadgeModule, DividerModule,
    ProgressBarModule, ButtonModule, ToastModule, SkeletonModule,
    ChartModule, TableModule, TooltipModule, RouterModule
  ],
  providers: [MessageService],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly svc = inject(DashboardService);
  readonly msg = inject(MessageService);
  downloadingPdf:WritableSignal<boolean> = signal(false);
  downloadingExcel:WritableSignal<boolean> = signal(false);
  loading: WritableSignal<boolean> = signal(true);
  summary: WritableSignal<DashboardSummaryDto | null> = signal(null);
  arcoAlerts: WritableSignal<ArcoAlertDto[]> = signal([]);
  contractAlerts: WritableSignal<ContractAlertDto[]> = signal([]);
  byTypeData: WritableSignal<any> = signal(null);
  trendData: WritableSignal<any> = signal(null);
  readonly typeLabels: Record<string, string> = REQUEST_TYPE_LABELS as any;

  readonly chartOptions = {
    responsive: true,
    plugins: {legend: {position: 'bottom'}},
    scales: {x: {stacked: true}, y: {stacked: true, beginAtZero: true}}
  };

  readonly pieOptions = {
    responsive: true,
    plugins: {legend: {position: 'right'}}
  };

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const [summary, byType, trend, arcoAlerts, contractAlerts] = await Promise.all([
        firstValueFrom(this.svc.getSummary()),
        firstValueFrom(this.svc.getArcoByType()),
        firstValueFrom(this.svc.getArcoTrend()),
        firstValueFrom(this.svc.getArcoAlerts()),
        firstValueFrom(this.svc.getContractAlerts()),
      ]);
      this.summary.set(summary);
      this.arcoAlerts.set(arcoAlerts);
      this.contractAlerts.set(contractAlerts);
      this.buildCharts(byType, trend);
    } catch {
      this.msg.add({severity: 'error', summary: 'Error', detail: 'No se pudo cargar el dashboard'});
    } finally {
      this.loading.set(false);
    }
  }

  private buildCharts(byType: ArcoByTypeDto[], trend: ArcoMonthlyTrendDto[]) {
    const colors = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#10b981'];
    this.byTypeData.set({
      labels: byType.map(t => this.typeLabels[t.requestType] ?? t.requestType),
      datasets: [{
        data: byType.map(t => t.count),
        backgroundColor: colors,
        borderWidth: 1
      }]
    });

    this.trendData.set({
      labels: trend.map(t => t.month),
      datasets: [
        {label: 'Pendiente', data: trend.map(t => t.pending), backgroundColor: '#f59e0b'},
        {label: 'En Proceso', data: trend.map(t => t.inProcess), backgroundColor: '#6366f1'},
        {label: 'Completado', data: trend.map(t => t.completed), backgroundColor: '#10b981'},
        {label: 'Rechazado', data: trend.map(t => t.rejected), backgroundColor: '#ef4444'},
      ]
    });
  }

  alertSeverity(alert: ArcoAlertDto): 'danger' | 'warn' {
    return alert.isOverdue ? 'danger' : 'warn';
  }
  downloadPdf(): void {
    this.downloadingPdf.set(true);
    this.svc.downloadSummaryPdf().subscribe({
      next: blob => {
        downloadBlob(blob, `reporte-cumplimiento-${this.todayStamp()}.pdf`);
        this.downloadingPdf.set(false);
      },
      error: () => this.downloadingPdf.set(false)
    });
  }

  downloadExcel(): void {
    this.downloadingExcel.set(true);
    this.svc.downloadSummaryExcel().subscribe({
      next: blob => {
        downloadBlob(blob, `reporte-cumplimiento-${this.todayStamp()}.xlsx`);
        this.downloadingExcel.set(false);
      },
      error: () => this.downloadingExcel.set(false)
    });
  }

  private todayStamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }
  contractSeverity(days: number): 'danger' | 'warn' | 'info' {
    if (days <= 0){ return 'danger';}
    if (days <= 7) {return 'warn';}
    return 'info';
  }
}
