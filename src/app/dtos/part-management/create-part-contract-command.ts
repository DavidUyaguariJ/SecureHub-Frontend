export interface CreatePartContractCommand {
  subjectId: string;
  companyName: string;
  contactEmail: string;
  contactPerson: string | null;
  purposeDescription: string;
  allowedFields: string[];
  validFrom: string;
  validUntil: string;
}
