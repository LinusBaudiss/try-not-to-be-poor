import { Routes } from '@angular/router';
import { Registration } from './registration/registration';
import { Login } from './login/login';
import { SavingsGoals } from './savings-goals/savings-goals';
import { ExpensesPage } from './expenses/expenses-page';
import { Month } from './month/month';
import { sessionGuard } from './session/session';

export const routes: Routes = [
  { path: 'registrieren', component: Registration },
  { path: 'anmelden', component: Login },
  { path: 'monat', title: 'Monat – Try Not to Be Poor', component: Month, canActivate: [sessionGuard] },
  { path: 'ausgaben', title: 'Ausgaben – Try Not to Be Poor', component: ExpensesPage, canActivate: [sessionGuard] },
  { path: 'sparziele', title: 'Sparziele – Try Not to Be Poor', component: SavingsGoals, canActivate: [sessionGuard] },
  { path: '', redirectTo: 'monat', pathMatch: 'full' },
  { path: '**', redirectTo: 'monat' }
];
