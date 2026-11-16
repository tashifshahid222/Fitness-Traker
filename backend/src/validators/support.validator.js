const { z } = require('zod');
const { TYPES } = require('../models/SupportTicket');

const createTicketSchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
  type: z.enum(TYPES).default('problem'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const updateTicketSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(2000).optional(),
  status: z.literal('closed').optional(),
});

const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
});

module.exports = { createTicketSchema, updateTicketSchema, ticketQuerySchema };