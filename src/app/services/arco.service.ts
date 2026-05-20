import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {SubjectLookupDto} from '../dtos/arco-management/subject-lookup-dto';
import {CreateArcoRequestDto} from '../dtos/arco-management/create-arco-request-dto';
import {ArcoRequestResponseDto} from '../dtos/arco-management/arco-request-response-dto';
import {ArcoRequestDetailDto} from '../dtos/arco-management/arco-request-detail-dto';
import {UpdateArcoStatusDto} from '../dtos/arco-management/update-arco-status-dto';

@Injectable({providedIn: 'root'})
export class ArcoService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly base: string = `${environment.baseUrl}/api/ArcoRequest`;

  lookupSubject(identification: string): Observable<SubjectLookupDto> {
    return this.http.get<SubjectLookupDto>(`${this.base}/subject/lookup`, {
      params: new HttpParams().set('identification', identification),
    });
  }

  createRequest(dto: CreateArcoRequestDto): Observable<ArcoRequestResponseDto> {
    return this.http.post<ArcoRequestResponseDto>(this.base, dto);
  }

  getAll(status?: string): Observable<ArcoRequestResponseDto[]> {
    let params: HttpParams = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ArcoRequestResponseDto[]>(this.base, {params});
  }

  getDetail(id: string): Observable<ArcoRequestDetailDto> {
    return this.http.get<ArcoRequestDetailDto>(`${this.base}/${id}`);
  }

  getBySubject(subjectId: string): Observable<ArcoRequestResponseDto[]> {
    return this.http.get<ArcoRequestResponseDto[]>(`${this.base}/subject/${subjectId}`);
  }

  updateStatus(id: string, dto: UpdateArcoStatusDto): Observable<ArcoRequestResponseDto> {
    return this.http.patch<ArcoRequestResponseDto>(`${this.base}/${id}/status`, dto);
  }

  downloadResponse(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/download`, {responseType: 'blob'});
  }
}

