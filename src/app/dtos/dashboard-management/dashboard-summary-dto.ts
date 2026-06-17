export interface DashboardSummaryDto {
  totalArcoRequests: number;
  pendingArcoRequests: number;
  inProcessArcoRequests: number;
  completedArcoRequests: number;
  rejectedArcoRequests: number;
  overdueArcoRequests: number;
  averageResolutionDays: number;
  complianceRate: number;
  activePartContracts: number;
  expiredPartContracts: number;
  revokedPartContracts: number;
  totalSubjects: number;
  subjectsWithBiometrics: number;
}
