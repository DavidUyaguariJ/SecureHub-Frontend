export interface SubjectLookupDto {
  id: string;
  identification: string;
  maskedFullName: string;
  maskedEmail: string;
  maskedPhone?: string;
  hasBiometrics: boolean;
}
