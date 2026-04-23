import {DeviceData} from './device-data';

export interface RegisterSubjectData {
  identification: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  subjectType: string;
  contactPerson: string;
  devices: DeviceData[];
  biometricImageBase64: string;
  consentText: string;
  templateType: string;
  digitalSignature: string;
}
