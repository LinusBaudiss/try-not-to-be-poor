import { Routes } from '@angular/router';
import { Registration } from './registration/registration';
import { Login } from './login/login';
import { Month } from './month/month';
import { sessionGuard } from './session/session';

export const routes: Routes = [
  { path: 'registrieren', component: Registration },
  { path: 'anmelden', component: Login },
  { path: 'monat', component: Month, canActivate: [sessionGuard] },
  { path: '', redirectTo: 'monat', pathMatch: 'full' },
  { path: '**', redirectTo: 'monat' }
];
