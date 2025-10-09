import { z } from 'zod';

// User validation
export const userSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'user', 'viewer']).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
});

// Price tolerance validation
export const priceToleranceSchema = z.object({
  material_category: z.string().min(1).max(100),
  tolerance_percentage: z.number().min(0).max(100),
  min_price: z.number().min(0),
  max_price: z.number().min(0),
  is_active: z.boolean().optional(),
});

// Quantity deviation validation
export const quantityDeviationSchema = z.object({
  material_type: z.string().min(1).max(100),
  deviation_percentage: z.number().min(0).max(100),
  min_quantity: z.number().min(0),
  max_quantity: z.number().min(0),
  is_active: z.boolean().optional(),
});

// UOM settings validation
export const uomSettingsSchema = z.object({
  uom_code: z.string().min(1).max(20),
  uom_description: z.string().min(1).max(200),
  is_active: z.boolean().optional(),
});

// UOM conversion validation
export const uomConversionSchema = z.object({
  from_uom: z.string().min(1).max(20),
  to_uom: z.string().min(1).max(20),
  conversion_factor: z.number().positive(),
  is_active: z.boolean().optional(),
});

// Site validation rules
export const siteValidationSchema = z.object({
  site_code: z.string().min(1).max(50),
  validation_type: z.string().min(1).max(100),
  validation_rule: z.string().min(1),
  is_active: z.boolean().optional(),
});

// Business rules validation
export const businessRuleSchema = z.object({
  rule_name: z.string().min(1).max(100),
  rule_type: z.string().min(1).max(50),
  rule_condition: z.string().min(1),
  rule_action: z.string().min(1),
  priority: z.number().int().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

// System configuration validation
export const systemConfigSchema = z.object({
  config_key: z.string().min(1).max(100),
  config_value: z.string().min(1),
  config_type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  description: z.string().max(500).optional(),
});

// Communication template validation
export const communicationTemplateSchema = z.object({
  template_name: z.string().min(1).max(100),
  template_type: z.enum(['email', 'whatsapp', 'sms']),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
  is_active: z.boolean().optional(),
});

// Template placeholder validation
export const templatePlaceholderSchema = z.object({
  placeholder_key: z.string().min(1).max(100),
  placeholder_description: z.string().max(500).optional(),
  default_value: z.string().optional(),
});

// Escalation matrix validation
export const escalationMatrixSchema = z.object({
  level: z.number().int().min(1).max(10),
  escalation_type: z.enum(['email', 'whatsapp', 'call']),
  threshold_hours: z.number().min(0),
  contact_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

// Escalation contact validation
export const escalationContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  role: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
});

// Query parameter validation
export const paginationSchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

// Email query validation
export const emailQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  include_spam: z.coerce.boolean().default(true),
  mailbox_folder: z.string().max(200).optional(),
});

// LPO queue query validation
export const lpoQueueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  urgency_level: z.enum(['all', 'high', 'medium', 'low']).default('all'),
  customer: z.string().max(200).optional(),
  sla_status: z.enum(['all', 'breached', 'at_risk', 'on_track']).default('all'),
  channel: z.enum(['all', 'email', 'whatsapp', 'portal']).default('all'),
  sort_by: z.enum(['urgency', 'date', 'customer', 'sla']).default('urgency'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID format')
    .or(z.coerce.number().int().positive()),
});

// Escalation mode validation
export const escalationModeSchema = z.object({
  mode: z.enum(['whatsapp', 'email', 'call']),
});
