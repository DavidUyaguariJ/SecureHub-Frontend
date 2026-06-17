export interface ContractAlertDto {
  contractId: string;
  companyName: string;
  validUntil: string;
  daysUntilExpiry: number;
  status: string;
}
