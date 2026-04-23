import { TestBed } from '@angular/core/testing';
import { App } from './app';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';

const mockKeycloak = {
  init: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  isLoggedIn: vi.fn().mockReturnValue(true),
  getToken: vi.fn().mockResolvedValue('token'),
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: 'Keycloak', useValue: mockKeycloak },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('SecureHub');
  });
});
