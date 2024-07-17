import { NgModule } from '@angular/core';
import {
  AbstractSecurityStorage,
  AuthInterceptor,
  AuthModule,
  LogLevel,
} from 'angular-auth-oidc-client';
import { environment } from '../../environments/environment';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LocalStorage } from './local-storage';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: environment.auth.ISSUER,
        redirectUrl: environment.auth.REDIRECT_URL,
        postLogoutRedirectUri: environment.auth.REDIRECT_URL,
        clientId: environment.auth.CLIENT_ID,
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        secureRoutes: [environment.apiEndpoint],
        logLevel: LogLevel.Debug,
        ignoreNonceAfterRefresh: true,
        triggerRefreshWhenIdTokenExpired: false,
        autoUserInfo: false,
      },
    }),
  ],
  exports: [AuthModule],
  providers: [
    { provide: AbstractSecurityStorage, useClass: LocalStorage },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
})
export class AuthConfigModule {}
