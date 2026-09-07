/**
 * Improved Database Module
 * Enhanced error handling, validation, and typed queries
 */

import { eq, desc, sql, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import {
  users, shipments, procurement, freight, customs, costs,
  documents, tasks, suppliers, emailTemplates, knowledge,
  auditLog, settings, companies, plants, departments,
  bankLc, docCheck, alertLog, notificationSettings
} from '../drizzle/schema';
import { InsertUser } from '../drizzle/schema';
import { ENV } from './_core/env';
import { createLogger } from './_core/logger';
import { DatabaseError, ValidationError, NotFoundError } from './_core/errors';
import { validate, shipmentSchema, costSchema, taskSchema } from './_core/validation';

const logger = createLogger('Database');

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection
 * Implements connection pooling and error recovery
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', error as Error);
      _db = null;
      throw new DatabaseError('Failed to establish database connection', error as Error);
    }
  }
  return _db;
}

// ============ User Functions (Enhanced) ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new ValidationError('User openId is required');
  }

  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ['name', 'email', 'loginMethod'] as const;

    textFields.forEach(field => {
      const v = user[field];
      if (v !== undefined) {
        values[field] = v ?? null;
        updateSet[field] = v ?? null;
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
    logger.info('User upserted', { openId: user.openId });
  } catch (error) {
    throw new DatabaseError('Failed to upsert user', error as Error, { openId: user.openId });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1).execute();
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw new DatabaseError('Failed to get user', error as Error, { openId });
  }
}

// ============ Shipments (Enhanced) ============
export async function getShipments() {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    return await db.select().from(shipments).orderBy(desc(shipments.createdAt)).execute();
  } catch (error) {
    throw new DatabaseError('Failed to fetch shipments', error as Error);
  }
}

export async function getShipmentById(id: number) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    const r = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1).execute();
    return r.length > 0 ? r[0] : null;
  } catch (error) {
    throw new DatabaseError('Failed to fetch shipment', error as Error, { shipmentId: id });
  }
}

export async function createShipment(data: any) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    // Validate input
    const validated = validate(shipmentSchema, data);
    
    const r = await db.insert(shipments).values({
      shipmentNo: validated.shipmentNo,
      ...validated,
    }).$returningId().execute();

    const newId = (r[0] as any).id || r[0];
    logger.info('Shipment created', { shipmentId: newId, shipmentNo: validated.shipmentNo });
    return { id: newId };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new DatabaseError('Failed to create shipment', error as Error, { data });
  }
}

export async function updateShipment(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    // Verify shipment exists
    const existing = await getShipmentById(id);
    if (!existing) throw new NotFoundError('Shipment', id);

    await db.update(shipments).set(data).where(eq(shipments.id, id)).execute();
    logger.info('Shipment updated', { shipmentId: id });
    return { id };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Failed to update shipment', error as Error, { shipmentId: id });
  }
}

export async function deleteShipment(id: number) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    // Verify shipment exists
    const existing = await getShipmentById(id);
    if (!existing) throw new NotFoundError('Shipment', id);

    await db.delete(shipments).where(eq(shipments.id, id)).execute();
    logger.info('Shipment deleted', { shipmentId: id });
    return { id };
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Failed to delete shipment', error as Error, { shipmentId: id });
  }
}

// ============ Costs (Enhanced with calculation) ============
export async function createCost(data: any) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    const validated = validate(costSchema, data);
    
    const total = (
      (validated.freightCost || 0) +
      (validated.insuranceCost || 0) +
      (validated.customsCost || 0) +
      (validated.transportationCost || 0) +
      (validated.storageCost || 0) +
      (validated.demurrageCost || 0) +
      (validated.detentionCost || 0) +
      (validated.handlingCost || 0) +
      (validated.otherCharges || 0)
    );

    const r = await db.insert(costs).values({
      ...validated,
      totalCost: total,
      landedCost: total,
    }).$returningId().execute();

    const newId = (r[0] as any).id || r[0];
    logger.info('Cost created', { costId: newId, shipmentId: validated.shipmentId, totalCost: total });
    return { id: newId, totalCost: total };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new DatabaseError('Failed to create cost', error as Error, { data });
  }
}

// ============ Tasks (Enhanced) ============
export async function createTask(data: any) {
  const db = await getDb();
  if (!db) throw new DatabaseError('Database connection unavailable');

  try {
    const validated = validate(taskSchema, data);
    
    // Verify shipment exists
    const shipment = await getShipmentById(validated.shipmentId);
    if (!shipment) throw new NotFoundError('Shipment', validated.shipmentId);

    const r = await db.insert(tasks).values(validated).$returningId().execute();
    const newId = (r[0] as any).id || r[0];
    logger.info('Task created', { taskId: newId, shipmentId: validated.shipmentId });
    return { id: newId };
  } catch (error) {
    if (error instanceof (ValidationError || NotFoundError)) throw error;
    throw new DatabaseError('Failed to create task', error as Error, { data });
  }
}

// ============ Health Check ============
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error('No database connection');
    
    // Simple query to verify connection
    await db.select().from(users).limit(1).execute();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Health check failed', error as Error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
}
