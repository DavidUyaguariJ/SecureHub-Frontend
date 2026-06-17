import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {DashboardSummaryDto} from '../dtos/dashboard-management/dashboard-summary-dto';
import {ArcoByTypeDto} from '../dtos/dashboard-management/arco-by-type-dto';
import {ArcoMonthlyTrendDto} from '../dtos/dashboard-management/arco-monthly-trend-dto';
import {ArcoAlertDto} from '../dtos/dashboard-management/arco-alert-dto';
import {ContractAlertDto} from '../dtos/dashboard-management/contract-alert-dto';
import {ImmutableAuditPageDto} from '../dtos/dashboard-management/immutable-audit-page-dto';

@Injectable({providedIn: 'root'})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/api/Dashboard`;

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(`${this.base}/summary`);
  }

  getArcoByType(): Observable<ArcoByTypeDto[]> {
    return this.http.get<ArcoByTypeDto[]>(`${this.base}/arco/by-type`);
  }

  getArcoTrend(months = 6): Observable<ArcoMonthlyTrendDto[]> {
    return this.http.get<ArcoMonthlyTrendDto[]>(`${this.base}/arco/trend`, {
      params: new HttpParams().set('months', months)
    });
  }

  getArcoAlerts(): Observable<ArcoAlertDto[]> {
    return this.http.get<ArcoAlertDto[]>(`${this.base}/alerts/arco`);
  }

  getContractAlerts(): Observable<ContractAlertDto[]> {
    return this.http.get<ContractAlertDto[]>(`${this.base}/alerts/contracts`);
  }

  getAuditLog(page = 1, pageSize = 20, action?: string, from?: string, to?: string): Observable<ImmutableAuditPageDto> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (action) {params = params.set('action', action);}
    if (from)   {params = params.set('from', from);}
    if (to)     {params = params.set('to', to);}
    return this.http.get<ImmutableAuditPageDto>(`${this.base}/audit-log`, {params});
  }
  downloadSummaryPdf(): Observable<Blob> {
    return this.http.get(`${this.base}/summary/report/pdf`, { responseType: 'blob' });
  }

  downloadSummaryExcel(): Observable<Blob> {
    return this.http.get(`${this.base}/summary/report/excel`, { responseType: 'blob' });
  }

  downloadAuditLogPdf(action?: string, from?: string, to?: string): Observable<Blob> {
    let params = new HttpParams();
    if (action) { params = params.set('action', action); }
    if (from) { params = params.set('from', from); }
    if (to) { params = params.set('to', to); }
    return this.http.get(`${this.base}/audit-log/report/pdf`, { params, responseType: 'blob' });
  }

  downloadAuditLogExcel(action?: string, from?: string, to?: string): Observable<Blob> {
    let params = new HttpParams();
    if (action) { params = params.set('action', action); }
    if (from) { params = params.set('from', from); }
    if (to) { params = params.set('to', to); }
    return this.http.get(`${this.base}/audit-log/report/excel`, { params, responseType: 'blob' });
  }

}

