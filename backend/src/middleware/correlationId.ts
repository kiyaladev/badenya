import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware that assigns a unique correlation ID to each request.
 * Uses the incoming `X-Request-Id` header if present, otherwise generates a UUID v4.
 * The ID is set on both the request headers and the response `X-Request-Id` header.
 */
export const correlationId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};
