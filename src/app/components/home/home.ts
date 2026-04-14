import { Component, inject } from '@angular/core';
import { AuthService } from '../../security/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `<h1>Hola, {{ username }}</h1>`
})
export class Home {
  private auth:AuthService = inject(AuthService);
  username:string = this.auth.getUsername();
}
