const mongoose = require('mongoose');

const TYPES = ['problem', 'feedback', 'question'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: TYPES,
      default: 'problem',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret.__v; return ret; } },
  }
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;