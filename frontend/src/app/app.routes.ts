import { Routes } from '@angular/router';
import { Registration } from './registration/registration';

export const routes: Routes = [
  { path: 'registrieren', component: Registration },
  { path: '', redirectTo: 'registrieren', pathMatch: 'full' },
  { path: '**', redirectTo: 'registrieren' }
];
