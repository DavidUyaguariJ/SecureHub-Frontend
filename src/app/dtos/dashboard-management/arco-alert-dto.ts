export interface ArcoAlertDto {
  requestId: string;
  subjectName: string;
  requestType: string;
  status: string;
  dueDate: string;
  daysOverdue: number;
  isOverdue: boolean;
}
