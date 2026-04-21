import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {RegisterSubjectData} from '../dtos/register-subject-data';
import {RegisterSubjectDataResponse} from '../dtos/register-subject-data-response';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsentManagerService {
  readonly baseUrl: string = `${environment.baseUrl}`;
  readonly http: HttpClient = inject(HttpClient);

  saveSubject(subject: RegisterSubjectData): Observable<RegisterSubjectDataResponse> {
    return this.http.post<RegisterSubjectDataResponse>(`${this.baseUrl}/api/Subject/register`, subject)
  }

}
