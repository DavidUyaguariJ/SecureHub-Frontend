export interface ImmutableAuditEventDto {
  auditLogId: string;
  arcoRequestId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  performedByName?: string;
  performedByRole?: string;
  notes?: string;
  ipAddress?: string;
  createdAt: string;
  integrityHash: string;
  blockchainAnchored: boolean;
}
