import { Routes } from '@angular/router';
import { Registration } from './registration/registration';
import { Login } from './login/login';
import { SavingsGoals } from './savings-goals/savings-goals';
import { ExpensesPage } from './expenses/expenses-page';
import { Month } from './month/month';
import { currentClientGuard, sessionGuard } from './session/session';
import { Update } from './update/update';

export const routes: Routes = [
  { path: 'aktualisieren', title: 'Seite aktualisieren – Try Not to Be Poor', component: Update },
  { path: 'registrieren', component: Registration, canActivate: [currentClientGuard] },
  { path: 'anmelden', component: Login, canActivate: [currentClientGuard] },
  { path: 'monat', title: 'Monat – Try Not to Be Poor', component: Month, canActivate: [sessionGuard] },
  { path: 'ausgaben', title: 'Ausgaben – Try Not to Be Poor', component: ExpensesPage, canActivate: [sessionGuard] },
  { path: 'sparziele', title: 'Sparziele – Try Not to Be Poor', component: SavingsGoals, canActivate: [sessionGuard] },
  { path: '', redirectTo: 'monat', pathMatch: 'full' },
  { path: '**', redirectTo: 'monat' }
];
