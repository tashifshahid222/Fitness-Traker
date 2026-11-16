const { z } = require('zod');

const measurementSchema = z.object({
  chest: z.coerce.number().min(0).optional(),
  waist: z.coerce.number().min(0).optional(),
  hips: z.coerce.number().min(0).optional(),
  arms: z.coerce.number().min(0).optional(),
  thighs: z.coerce.number().min(0).optional(),
});

const performanceItemSchema = z.object({
  metric: z.string().trim().min(1, 'Metric name is required').max(80),
  value: z.coerce.number(),
  unit: z.string().trim().max(20).default(''),
});

const progressBodySchema = z
  .object({
    weight: z.coerce.number().min(0).optional(),
    measurements: measurementSchema.optional(),
    performance: z.array(performanceItemSchema).max(20).default([]),
    date: z.coerce.date('Invalid date'),
    notes: z.string().trim().max(500).default(''),
  })
  .refine((v) => v.weight !== undefined || Object.keys(v.measurements || {}).length > 0 || (v.performance || []).length > 0, {
    message: 'Provide at least one of: weight, measurements, or performance',
    path: ['weight'],
  });

const progressQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  sort: z.string().optional(),
  from: z.coerce.date('Invalid from date').optional(),
  to: z.coerce.date('Invalid to date').optional(),
});

module.exports = { progressBodySchema, progressQuerySchema };