const mongoose = require('mongoose');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const nutritionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, 'Meal type is required'],
      index: true,
    },
    foodItems: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [120, 'Food item cannot exceed 120 characters'],
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one food item is required',
      },
    },
    quantity: {
      type: String,
      trim: true,
      maxlength: [60, 'Quantity cannot exceed 60 characters'],
      default: '',
    },
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: [0, 'Calories cannot be negative'],
    },
    protein: {
      type: Number,
      min: [0, 'Protein cannot be negative'],
      default: 0,
    },
    carbohydrates: {
      type: Number,
      min: [0, 'Carbohydrates cannot be negative'],
      default: 0,
    },
    fats: {
      type: Number,
      min: [0, 'Fats cannot be negative'],
      default: 0,
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

nutritionSchema.index({ userId: 1, date: -1 });
nutritionSchema.index({ userId: 1, mealType: 1 });

module.exports = mongoose.model('Nutrition', nutritionSchema);
module.exports.MEAL_TYPES = MEAL_TYPES;
