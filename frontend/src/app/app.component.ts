import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="!isLoginPage" style="display:flex;height:100vh">
      <app-sidebar></app-sidebar>
      <div style="flex:1;padding:16px;overflow:auto">
        <router-outlet></router-outlet>
      </div>
    </div>
    <router-outlet *ngIf="isLoginPage"></router-outlet>
  `
})
export class AppComponent {
  isLoginPage = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage = event.url === '/login' || event.url === '/';
      });
  }
}
