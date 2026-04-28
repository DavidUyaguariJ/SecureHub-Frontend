export interface ArcoAuditLogDto {
  id: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  performedByRole?: string;
  notes?: string;
  createdAt: string;
}
