import {Injectable} from "@angular/core";
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from 'rxjs';
import {PartContractDto} from '../dtos/part-management/part-contract-dto';
import {BlockchainStatus} from '../dtos/part-management/blockchain-status';
import {CreatePartContractCommand} from '../dtos/part-management/create-part-contract-command';
import {RevokePartContractCommand} from '../dtos/part-management/revoke-part-contract-command';
import {SubjectLookupDto} from '../dtos/arco-management/subject-lookup-dto';

@Injectable({providedIn: 'root'})
export class PartContractService {
  private readonly base: string = `${environment.baseUrl}/api/PartContract`;

  constructor(private http: HttpClient) {
  }

  getAll(status?: string): Observable<PartContractDto[]> {
    let params = new HttpParams();
    if (status) {params = params.set('status', status);}
    return this.http.get<PartContractDto[]>(this.base, {params});
  }

  getById(id: string): Observable<PartContractDto> {
    return this.http.get<PartContractDto>(`${this.base}/${id}`);
  }

  getBlockchainStatus(id: string): Observable<BlockchainStatus> {
    return this.http.get<BlockchainStatus>(`${this.base}/${id}/blockchain-status`);
  }

  getAvailableFields(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.base}/available-fields`);
  }

  create(cmd: CreatePartContractCommand): Observable<PartContractDto> {
    return this.http.post<PartContractDto>(this.base, cmd);
  }

  revoke(id: string, cmd: RevokePartContractCommand): Observable<PartContractDto> {
    return this.http.post<PartContractDto>(`${this.base}/${id}/revoke`, cmd);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, {responseType: 'blob'});
  }

  getExternalSubjectData(subjectId: string): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(
      `${environment.baseUrl}/api/ExternalSubject/${subjectId}`
    );
  }

  lookupSubject(identification: string): Observable<SubjectLookupDto> {
    return this.http.get<SubjectLookupDto>(
      `${this.base}/subject-lookup`,
      { params: { identification } }
    );
  }
  renew(id: string, cmd: { validFrom: string; validUntil: string }): Observable<PartContractDto> {
    return this.http.post<PartContractDto>(`${this.base}/${id}/renew`, cmd);
  }
}
