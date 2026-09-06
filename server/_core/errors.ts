/**
 * Centralized Error Handling
 * Provides structured error types and recovery strategies
 */

import { TRPCError } from '@trpc/server';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, context);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      'NOT_FOUND',
      `${resource} not found${id ? ` (ID: ${id})` : ''}`,
      404,
      { resource, id }
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('CONFLICT', message, 409, context);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, error?: Error, context?: Record<string, any>) {
    super(
      'DATABASE_ERROR',
      message,
      500,
      { ...context, originalError: error?.message }
    );
    this.name = 'DatabaseError';
  }
}

export function toTRPCError(error: any): TRPCError {
  if (error instanceof AppError) {
    const codeMap: Record<string, any> = {
      'VALIDATION_ERROR': 'BAD_REQUEST',
      'NOT_FOUND': 'NOT_FOUND',
      'UNAUTHORIZED': 'UNAUTHORIZED',
      'FORBIDDEN': 'FORBIDDEN',
      'CONFLICT': 'CONFLICT',
      'DATABASE_ERROR': 'INTERNAL_SERVER_ERROR',
    };
    return new TRPCError({
      code: codeMap[error.code] || 'INTERNAL_SERVER_ERROR',
      message: error.message,
      cause: error,
    });
  }
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error?.message || 'Unknown error',
    cause: error,
  });
}
