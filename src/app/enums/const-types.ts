import {ArcoRequestType} from './arco-request-type';
import {ArcoStatus} from './arco-status';

export const REQUEST_TYPE_LABELS: Record<ArcoRequestType, string> = {
  ACCESO: 'Acceso a mis datos',
  RECTIFICACION: 'Rectificación de datos',
  CANCELACION: 'Eliminación de datos',
  OPOSICION: 'Oposición al tratamiento',
  PORTABILIDAD: 'Portabilidad de datos',
};

export const REQUEST_TYPE_ICONS: Record<ArcoRequestType, string> = {
  ACCESO: 'pi pi-eye',
  RECTIFICACION: 'pi pi-pencil',
  CANCELACION: 'pi pi-trash',
  OPOSICION: 'pi pi-ban',
  PORTABILIDAD: 'pi pi-download',
};

export const STATUS_LABELS: Record<ArcoStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  RECHAZADO: 'Rechazado',
};

export const STATUS_SEVERITY: Record<ArcoStatus, 'warn' | 'info' | 'success' | 'danger'> = {
  PENDIENTE: 'warn',
  EN_PROCESO: 'info',
  COMPLETADO: 'success',
  RECHAZADO: 'danger',
};

export type ActionType = 'approve' | 'reject' | 'process';
export type ArcoStep = 'lookup' | 'verify' | 'form' | 'success';

