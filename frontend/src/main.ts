import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { sessionInterceptor } from './app/session/session.interceptor';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { BASE_PATH } from './app/api/variables';

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([sessionInterceptor])), provideRouter(routes), { provide: BASE_PATH, useValue: '/api/v1' }]
}).catch(() => {
  document.body.textContent = 'Die Anwendung konnte nicht geladen werden. Lade die Seite erneut.';
});
