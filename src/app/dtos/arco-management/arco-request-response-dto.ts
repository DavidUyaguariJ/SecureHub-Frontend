import {ArcoStatus} from '../../enums/arco-status';
import {ArcoRequestType} from '../../enums/arco-request-type';

export interface ArcoRequestResponseDto {
  id: string;
  subjectId: string;
  subjectFullName: string;
  requestType: ArcoRequestType;
  status: ArcoStatus;
  description?: string;
  requestedAt: string;
  dueDate?: string;
  resolvedAt?: string;
  responseText?: string;
  rejectedReason?: string;
  hasResponseFile: boolean;
}
