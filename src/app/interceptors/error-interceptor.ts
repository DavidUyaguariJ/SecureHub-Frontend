import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {MessageService} from 'primeng/api';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);
  return next(req).pipe(
    catchError((err: unknown) => {
      let message = 'Error desconocido';
      if (err instanceof HttpErrorResponse) {
        message =
          err.error?.message ||
          err.message ||
          'Error en la petición';
      } else if (err && typeof err === 'object' && 'message' in err) {
        message = String((err as { message?: string }).message);
      }
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: message
      });
      return throwError(() => err);
    })
  );
};
