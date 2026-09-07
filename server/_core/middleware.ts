/**
 * Centralized Middleware
 * Request logging, error handling, and monitoring
 */

import { Express, Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';

const logger = createLogger('Middleware');

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID?.() || Math.random().toString(36);
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Request logging middleware
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = (req as any).requestId;

  const originalSend = res.send.bind(res);
  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
    });
    return originalSend(data);
  };

  next();
}

// Error handling middleware
export function errorHandlingMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req as any).requestId;
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  logger.error('HTTP Error', error, {
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
      requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  });
}
