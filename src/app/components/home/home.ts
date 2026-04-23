import {Component, inject, OnInit, signal} from '@angular/core';
import {AuthService} from '../../security/auth.service';
import {Card} from 'primeng/card';
import {Avatar} from 'primeng/avatar';
import {Tag} from 'primeng/tag';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Card,
    Avatar,
    Tag
  ],
  templateUrl: './home.html'
})
export class Home implements OnInit {
  private auth = inject(AuthService);

  username = signal<string>('');

  ngOnInit(): void {
    this.username.set(this.auth.getUsername());
  }

}
