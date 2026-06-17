import {DevicePortalDto} from './device-portal';

export interface SubjectPortalDto {
  id: string;
  identification: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  subjectType?: string;
  contactPerson?: string;
  hasBiometrics: boolean;
  createdAt: string;
  devices: DevicePortalDto[];
}
