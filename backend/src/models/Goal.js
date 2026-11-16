const mongoose = require('mongoose');

const STATUSES = ['active', 'completed', 'abandoned'];

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    targetValue: {
      type: Number,
      required: [true, 'Target value is required'],
      min: [0.01, 'Target value must be greater than 0'],
    },
    currentValue: {
      type: Number,
      default: 0,
      min: [0, 'Current value cannot be negative'],
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [30, 'Unit cannot exceed 30 characters'],
      default: '',
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret.__v; return ret; } },
  }
);

goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, deadline: 1 });

goalSchema.virtual('progressPercent').get(function () {
  if (!this.targetValue) return 0;
  return Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
});

goalSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Goal', goalSchema);
module.exports.STATUSES = STATUSES;
