const { z } = require('zod');
const { MEAL_TYPES } = require('../models/Nutrition');

const nutritionBodySchema = z.object({
  mealType: z.enum(MEAL_TYPES),
  foodItems: z
    .array(z.string().trim().min(1, 'Food item cannot be empty').max(120))
    .min(1, 'At least one food item is required')
    .max(20),
  quantity: z.string().trim().max(60).default(''),
  calories: z.coerce.number().min(0).default(0),
  protein: z.coerce.number().min(0).default(0),
  carbohydrates: z.coerce.number().min(0).default(0),
  fats: z.coerce.number().min(0).default(0),
  date: z.coerce.date('Invalid date'),
  notes: z.string().trim().max(500).default(''),
});

const nutritionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
  sort: z.string().optional(),
  from: z.coerce.date('Invalid from date').optional(),
  to: z.coerce.date('Invalid to date').optional(),
  mealType: z.enum(MEAL_TYPES).optional(),
});

module.exports = { nutritionBodySchema, nutritionQuerySchema };