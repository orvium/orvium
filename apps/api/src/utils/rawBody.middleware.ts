import { Request, Response } from 'express';

export interface RequestWithRawBody extends Request {
  rawBody: Buffer;
}

export function rawBodyMiddleware(
  request: RequestWithRawBody,
  response: Response,
  buffer: Buffer
): void {
  if (!request.headers['stripe-signature']) {
    return;
  }

  if (Buffer.isBuffer(buffer)) {
    request.rawBody = Buffer.from(buffer);
  }
}
