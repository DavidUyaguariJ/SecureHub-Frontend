export interface PartContractDto {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPerson: string | null;
  purposeDescription: string;
  allowedFields: string[];
  validFrom: string;
  validUntil: string;
  status: 'ACTIVO' | 'SUSPENDIDO' | 'REVOCADO' | 'VENCIDO';
  keycloakUsername: string | null;
  blockchainTxHash: string | null;
  isActive: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
}
