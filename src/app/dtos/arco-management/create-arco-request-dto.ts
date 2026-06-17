import {ArcoRequestType} from '../../enums/arco-request-type';
import {UpdateSubjectDataDto} from './update-subject-data-dto';

export interface CreateArcoRequestDto {
  subjectId: string;
  requestType: ArcoRequestType;
  description?: string;
  imageBase64: string;
  updatedData?: UpdateSubjectDataDto;
}
