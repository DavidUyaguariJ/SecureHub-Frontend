import {ArcoStatus} from '../../enums/arco-status';

export interface UpdateArcoStatusDto {
  newStatus: ArcoStatus;
  responseText?: string;
  rejectedReason?: string;
  operatorRole?: string;
}
