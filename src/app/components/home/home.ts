import {Component, computed, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../security/auth.service';
import {Card} from 'primeng/card';
import {Avatar} from 'primeng/avatar';
import {Tag} from 'primeng/tag';

interface QuickAccessItem {
  label: string;
  description: string;
  icon: string;
  route: string;
  severity: 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Card, Avatar, Tag],
  templateUrl: './home.html'
})
export class Home implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username: WritableSignal<string> = signal('');
  greeting: WritableSignal<string> = signal('');
  quickAccess: WritableSignal<QuickAccessItem[]> = signal([]);

  roleLabel: Signal<string> = computed(() => {
    if (this.auth.hasAnyRole(['admin_role'])) { return 'Administrador'; }
    if (this.auth.hasAnyRole(['technician_role'])) { return 'Técnico DPO'; }
    if (this.auth.hasAnyRole(['applicant_role'])) { return 'Titular de Datos'; }
    if (this.auth.hasAnyRole(['external_role'])) { return 'Encargado Externo'; }
    return 'Usuario';
  });

  ngOnInit(): void {
    this.username.set(this.auth.getUsername());
    this.greeting.set(this.buildGreeting());
    this.quickAccess.set(this.buildQuickAccess());
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) { return 'Buenos días'; }
    if (hour < 19) { return 'Buenas tardes'; }
    return 'Buenas noches';
  }

  private buildQuickAccess(): QuickAccessItem[] {
    const isAdmin = this.auth.hasAnyRole(['admin_role']);
    const isTechnician = this.auth.hasAnyRole(['admin_role', 'technician_role']);
    const isApplicant = this.auth.hasAnyRole(['admin_role', 'applicant_role']);
    const isExternal = this.auth.hasAnyRole(['admin_role', 'external_role']);
    const items: QuickAccessItem[] = [];
    if (isTechnician) {
      items.push({
        label: 'Gestión de Consentimientos',
        description: 'Administra los consentimientos registrados en el sistema.',
        icon: 'pi pi-book', route: '/manage-consent', severity: 'info'
      });
      items.push({label: 'Solicitudes ARCO', description: 'Revisa y resuelve las solicitudes de derechos ARCO.', icon: 'pi pi-cog',
        route: '/arco-manage', severity: 'secondary'});
    }
    if (isApplicant) {
      items.push({label: 'Generar Solicitud ARCO', description: 'Crea una nueva solicitud sobre tus datos personales.',
        icon: 'pi pi-plus', route: '/arco-request', severity: 'success'});
      items.push({label: 'Mis Datos', description: 'Consulta y verifica tu registro biométrico.', icon: 'pi pi-face-smile', route: '/my-data', severity: 'info'
      });
    }
    if (isAdmin) {
      items.push({label: 'Encargados', description: 'Gestiona contratos con terceros encargados del tratamiento.', icon: 'pi pi-building',
        route: '/part-contracts', severity: 'warn'});
      items.push({label: 'Dashboard de Cumplimiento', description: 'Visualiza indicadores y métricas de cumplimiento LOPDP.', icon: 'pi pi-chart-bar',
        route: '/dashboard', severity: 'danger'});
      items.push({label: 'Bitácora de Auditoría',
        description: 'Consulta el registro inmutable de eventos del sistema.', icon: 'pi pi-shield', route: '/audit-log', severity: 'contrast'});
    }
    if (isExternal) {
      items.push({label: 'Portal Externo', description: 'Accede a los datos autorizados por tu contrato vigente.', icon: 'pi pi-lock-open',
        route: '/external-portal', severity: 'success'});
    }
    return items;
  }
}
