import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, throwError } from 'rxjs';
import { Session } from './session';

export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const url = new URL(request.url, window.location.origin);
  const supported = url.origin === window.location.origin && /^\/api\/v[12]\//.test(url.pathname);
  if (!supported || /^\/api\/v[12]\/access\/(registrations|csrf|login|refresh|logout)$/.test(url.pathname)) return next(request);
  const session = inject(Session);
  const version = session.generation();
  const token = session.token();
  if (!token) return throwError(() => new HttpErrorResponse({ status: 401 }));
  const send = (accessToken: string) => next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
  const stale = () => throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Sitzung beendet' }));
  return send(token).pipe(
    catchError((failure: HttpErrorResponse) => {
      if (version !== session.generation() || failure.status !== 401) return throwError(() => failure);
      const current = session.token();
      if (current && current !== token) return send(current);
      return from(session.refresh()).pipe(mergeMap(ok => {
        const replacement = session.token();
        return ok && replacement && version === session.generation() ? send(replacement) : stale();
      }));
    }),
    mergeMap(event => version === session.generation() ? [event] : stale())
  );
};
