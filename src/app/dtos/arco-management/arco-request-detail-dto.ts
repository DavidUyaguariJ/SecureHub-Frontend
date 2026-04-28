import {ArcoRequestResponseDto} from './arco-request-response-dto';
import {ArcoAuditLogDto} from './arco-audit-log-dto';

export interface ArcoRequestDetailDto {
  request: ArcoRequestResponseDto;
  auditLogs: ArcoAuditLogDto[];
}
