export interface RegisterSubjectDataResponse {
  subjectId: string;
  devices: { deviceId: string; deviceType: string; serialNumber: string }[];
  biometricAuthId: string;
  message: string;
}
