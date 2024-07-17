import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { environment } from '../environments/environment';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: environment.auth.ISSUER + '.well-known/jwks.json',
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: environment.auth.AUTH0_AUDIENCE,
      issuer: environment.auth.ISSUER,
      algorithms: ['RS256'],
    });
  }

  validate(payload: AuthPayload): AuthPayload {
    return payload;
  }
}

export class AuthPayload {
  iss!: string;
  sub!: string;
  aud!: string[];
  iat!: number;
  exp!: number;
  azp!: string;
  scope!: string;
  permissions!: string[];
}
