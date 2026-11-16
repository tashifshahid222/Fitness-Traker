const { z } = require('zod');
const { CATEGORIES } = require('../models/Workout');

const workoutBodySchema = z.object({
  exerciseName: z.string().trim().min(1, 'Exercise name is required').max(120),
  sets: z.coerce.number().int().min(0).default(0),
  reps: z.coerce.number().int().min(0).default(0),
  weight: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(1000).default(''),
  category: z.enum(CATEGORIES).default('strength'),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).default([]),
  date: z.coerce.date('Invalid date'),
});

const workoutQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  sort: z.string().optional(),
  from: z.coerce.date('Invalid from date').optional(),
  to: z.coerce.date('Invalid to date').optional(),
  category: z.enum(CATEGORIES).optional(),
});

module.exports = { workoutBodySchema, workoutQuerySchema };