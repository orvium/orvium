import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrAnonymousGuard extends AuthGuard(['jwt', 'anonymous']) {}
