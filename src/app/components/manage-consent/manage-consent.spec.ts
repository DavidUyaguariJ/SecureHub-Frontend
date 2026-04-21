import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageConsent } from './manage-consent';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConsentManagerService } from '../../services/consent-management.service';
import { of, throwError } from 'rxjs';
import { DeviceData } from '../../dtos/device-data';
import { WebcamImage } from 'ngx-webcam';
import { vi } from 'vitest';

const mockConsentService = {
  saveSubject: vi.fn(),
};

describe('ManageConsent', () => {
  let component: ManageConsent;
  let fixture: ComponentFixture<ManageConsent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageConsent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
        { provide: ConsentManagerService, useValue: mockConsentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageConsent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ───────────────── Inicialización ─────────────────
  describe('Inicialización', () => {
    it('debe crearse correctamente', () => {
      expect(component).toBeTruthy();
    });

    it('valores iniciales correctos', () => {
      expect(component.devices()).toHaveLength(0);
      expect(component.subjectModel().subjectType).toBe('PERSONA');
      expect(component.isCameraActive()).toBe(false);
      expect(component.imagePreview()).toBeNull();
      expect(component.biometricBase64()).toBe('');
      expect(component.isEmpresa()).toBe(false);
    });
  });

  // ───────────────── isEmpresa ─────────────────
  describe('isEmpresa', () => {
    it('true cuando es EMPRESA', () => {
      component.subjectModel.update(m => ({ ...m, subjectType: 'EMPRESA' }));
      expect(component.isEmpresa()).toBe(true);
    });

    it('false cuando es PERSONA', () => {
      component.subjectModel.update(m => ({ ...m, subjectType: 'PERSONA' }));
      expect(component.isEmpresa()).toBe(false);
    });
  });

  // ───────────────── Dispositivos ─────────────────
  describe('Dispositivos', () => {
    const validDevice: DeviceData = {
      deviceType: 'Laptop',
      brand: 'Dell',
      model: 'XPS',
      serialNumber: 'SN123',
      systemUser: 'admin',
      password: 'password123',
    };

    it('agrega dispositivo válido', () => {
      component.currentDevice.set({ ...validDevice });
      component.saveDevice();
      expect(component.devices()).toHaveLength(1);
    });

    it('no agrega si falta deviceType', () => {
      component.currentDevice.set({ ...validDevice, deviceType: '' });
      component.saveDevice();
      expect(component.devices()).toHaveLength(0);
    });

    it('elimina dispositivo', () => {
      component.devices.set([validDevice]);
      component.removeDevice(0);
      expect(component.devices()).toHaveLength(0);
    });
  });

  // ───────────────── Webcam ─────────────────
  describe('Webcam', () => {
    it('toggle cámara', () => {
      component.toggleCamera();
      expect(component.isCameraActive()).toBe(true);
    });

    it('handleImage guarda datos', () => {
      const img = {
        imageAsBase64: 'abc',
        imageAsDataUrl: 'data:image/jpeg;base64,abc',
      } as WebcamImage;

      component.handleImage(img);

      expect(component.biometricBase64()).toBe('abc');
      expect(component.imagePreview()).toContain('base64');
      expect(component.isCameraActive()).toBe(false);
    });
  });

  // ───────────────── Submit ─────────────────
  describe('Submit', () => {
    beforeEach(() => {
      component.subjectModel.set({
        identification: '1234567890',
        fullName: 'Juan',
        email: 'juan@test.com',
        phone: '0999999999',
        address: 'Quito',
        subjectType: 'PERSONA',
        contactPerson: '',
      });

      component.devices.set([{
        deviceType: 'Laptop',
        brand: 'Dell',
        model: 'XPS',
        serialNumber: 'SN123',
        systemUser: 'admin',
        password: 'password123'
      }]);

      component.biometricBase64.set('base64');
    });

    it('debe llamar al servicio', async () => {
      mockConsentService.saveSubject.mockReturnValue(of({}));

      const confirmSpy = vi.spyOn(component.confirmationService, 'confirm');

      await component.onSubmit(new Event('submit'));

      expect(mockConsentService.saveSubject).toHaveBeenCalled();
      expect(confirmSpy).toHaveBeenCalled();
      expect(component.loading()).toBe(false);
    });

    it('debe manejar error sin romper flujo', async () => {
      mockConsentService.saveSubject.mockReturnValue(
        throwError(() => ({ error: { message: 'Duplicado' } }))
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await component.onSubmit(new Event('submit'));

      expect(mockConsentService.saveSubject).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      expect(component.loading()).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  // ───────────────── Reset ─────────────────
  describe('resetForm', () => {
    it('limpia todo', () => {
      component.devices.set([{
        deviceType: 'Laptop',
        brand: 'Dell',
        model: 'XPS',
        serialNumber: 'SN1',
        systemUser: 'admin',
        password: '12345678'
      }]);

      component.biometricBase64.set('abc');
      component.imagePreview.set('img');

      component.resetForm();

      expect(component.devices()).toHaveLength(0);
      expect(component.biometricBase64()).toBe('');
      expect(component.imagePreview()).toBeNull();
      expect(component.subjectModel().identification).toBe('');
    });
  });
});
