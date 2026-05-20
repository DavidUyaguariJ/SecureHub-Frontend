import {HttpClient} from "@angular/common/http";
import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {SubjectPortalDto} from '../dtos/arco-management/subject-portal-dto';
import {RegisterBiometricCommand} from '../dtos/arco-management/register-biometric-command';
import {VerifyBiometricCommand} from '../dtos/arco-management/verify-biometric-command';

@Injectable({providedIn: 'root'})
export class SubjectPortalService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly base: string = `${environment.baseUrl}/api/SubjectPortal`;

  getMyData(subjectId: string): Observable<SubjectPortalDto> {
    return this.http.get<SubjectPortalDto>(`${this.base}/${subjectId}`);
  }

  registerBiometric(subjectId: string, cmd: RegisterBiometricCommand): Observable<{
    biometricId: string;
    message: string
  }> {
    return this.http.post<{ biometricId: string; message: string }>(
      `${this.base}/${subjectId}/biometric`, cmd);
  }

  verifyBiometric(subjectId: string, cmd: VerifyBiometricCommand): Observable<{ verified: boolean; message: string }> {
    return this.http.post<{ verified: boolean; message: string }>(
      `${this.base}/${subjectId}/biometric/verify`, cmd);
  }
}

