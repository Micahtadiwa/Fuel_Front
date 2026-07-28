import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(req).pipe(
      // Sliding session: the backend returns a refreshed JWT in X-New-Token on
      // every authenticated response. Swap it in so lastActivity keeps advancing
      // and the session doesn't expire while the user is active.
      tap(event => {
        if (event instanceof HttpResponse) {
          const newToken = event.headers.get('X-New-Token');
          if (newToken) {
            this.auth.setToken(newToken);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // 401 = token expired/inactive. Clear session and send back to login.
        if (error.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login'], {
            queryParams: { reason: 'session-expired' }
          });
        }
        return throwError(() => error);
      })
    );
  }
}
