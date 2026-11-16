const mongoose = require('mongoose');

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'other'];

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    exerciseName: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
      maxlength: [120, 'Exercise name cannot exceed 120 characters'],
    },
    sets: {
      type: Number,
      min: [0, 'Sets cannot be negative'],
      default: 0,
    },
    reps: {
      type: Number,
      min: [0, 'Reps cannot be negative'],
      default: 0,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'strength',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, 'Tag cannot exceed 30 characters'],
      },
    ],
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: false, transform(doc, ret) { delete ret.__v; return ret; } },
  }
);

workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, category: 1 });
workoutSchema.index({ userId: 1, exerciseName: 1 });

module.exports = mongoose.model('Workout', workoutSchema);
module.exports.CATEGORIES = CATEGORIES;
