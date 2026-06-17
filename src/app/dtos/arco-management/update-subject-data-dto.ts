import {UpdateDeviceDto} from './update-device-dto';

export interface UpdateSubjectDataDto {
  fullName?: string;
  phone?: string;
  address?: string;
  email?: string;
  devices?: UpdateDeviceDto[];
}
