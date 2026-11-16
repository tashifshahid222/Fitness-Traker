const { z } = require('zod');
const { STATUSES } = require('../models/Goal');

const goalBodySchema = z.object({
  title: z.string().trim().min(1, 'Goal title is required').max(120),
  description: z.string().trim().max(500).default(''),
  targetValue: z.coerce.number().positive('Target value must be greater than 0'),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().trim().max(30).default(''),
  deadline: z.coerce.date('Invalid deadline').optional(),
  status: z.enum(STATUSES).optional(),
});

const goalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  sort: z.string().optional(),
  status: z.enum(STATUSES).optional(),
});

module.exports = { goalBodySchema, goalQuerySchema };