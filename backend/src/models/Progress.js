const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    metric: {
      type: String,
      required: [true, 'Performance metric name is required'],
      trim: true,
      maxlength: [80, 'Metric name cannot exceed 80 characters'],
    },
    value: {
      type: Number,
      required: [true, 'Performance value is required'],
    },
    unit: {
      type: String,
      trim: true,
      maxlength: [20, 'Unit cannot exceed 20 characters'],
      default: '',
    },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    measurements: {
      chest: { type: Number, min: 0 },
      waist: { type: Number, min: 0 },
      hips: { type: Number, min: 0 },
      arms: { type: Number, min: 0 },
      thighs: { type: Number, min: 0 },
    },
    performance: {
      type: [performanceSchema],
      default: [],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { transform(doc, ret) { delete ret.__v; return ret; } },
  }
);

progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
