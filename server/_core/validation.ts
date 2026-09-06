/**
 * Data Validation Utilities
 * Centralized validation for common data types
 */

import { z } from 'zod';
import { ValidationError } from './errors';

// Shipment Validation
export const shipmentSchema = z.object({
  shipmentNo: z.string().min(1, 'Shipment number is required'),
  supplierName: z.string().optional(),
  poNumber: z.string().optional(),
  material: z.string().optional(),
  incoterm: z.enum(['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DAT', 'DDP']).optional(),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
  transportMode: z.enum(['sea', 'air', 'land', 'rail']).optional(),
  cargoValue: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

// Cost Calculation Validation
export const costSchema = z.object({
  shipmentId: z.number().positive(),
  freightCost: z.number().nonnegative().default(0),
  insuranceCost: z.number().nonnegative().default(0),
  customsCost: z.number().nonnegative().default(0),
  transportationCost: z.number().nonnegative().default(0),
  storageCost: z.number().nonnegative().default(0),
  demurrageCost: z.number().nonnegative().default(0),
  detentionCost: z.number().nonnegative().default(0),
  handlingCost: z.number().nonnegative().default(0),
  otherCharges: z.number().nonnegative().default(0),
});

// Task Validation
export const taskSchema = z.object({
  shipmentId: z.number().positive(),
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.date().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('not_started'),
});

// Customs Validation
export const customsSchema = z.object({
  shipmentId: z.number().positive(),
  acidNumber: z.string().optional(),
  ucrNumber: z.string().optional(),
  broker: z.string().optional(),
  status: z.enum(['pending_acid', 'acid_issued', 'arrived', 'under_inspection', 'released', 'cleared']).default('pending_acid'),
});

// Notification Settings Validation
export const notificationSettingSchema = z.object({
  eventKey: z.string().min(1),
  enabled: z.enum(['yes', 'no']),
});

// Validate and throw error
export function validate<T>(schema: z.ZodSchema, data: any): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(message, { errors: error.errors });
    }
    throw error;
  }
}
