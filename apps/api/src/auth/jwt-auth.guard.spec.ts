import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard()).toBeDefined();
  });

  it('should handle request', () => {
    const guard = new JwtAuthGuard();
    const result = guard.handleRequest(null, 'example', null);
    expect(result).toBe('example');
  });

  it('should throw expection', () => {
    const guard = new JwtAuthGuard();
    expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
  });
});
