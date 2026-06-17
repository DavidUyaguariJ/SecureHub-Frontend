import {ImmutableAuditEventDto} from './immutable-audit-event-dto';

export interface ImmutableAuditPageDto {
  items: ImmutableAuditEventDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}
