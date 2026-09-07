/**
 * Improved tRPC Configuration
 * Enhanced error handling and type safety
 */

import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TrpcContext } from './context';
import { createLogger } from './logger';
import { toTRPCError } from './errors';

const logger = createLogger('tRPC');

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => {
    logger.error('tRPC Error', error.originalError as Error, {
      code: shape.code,
      message: shape.message,
    });
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authenticated users
const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    logger.warn('Unauthorized access attempt', undefined, {
      requestId: (ctx.req as any).requestId,
    });
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: UNAUTHED_ERR_MSG,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Middleware for admin users
const requireAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: UNAUTHED_ERR_MSG,
    });
  }

  if (ctx.user.role !== 'admin') {
    logger.warn('Unauthorized admin access attempt', undefined, {
      userId: ctx.user.id,
      requestId: (ctx.req as any).requestId,
    });
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: NOT_ADMIN_ERR_MSG,
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(requireAdmin);

// Middleware for error handling and recovery
export const errorHandlingProcedure = t.procedure.use(async (opts) => {
  try {
    return await opts.next();
  } catch (error) {
    const trpcError = toTRPCError(error);
    throw trpcError;
  }
});
