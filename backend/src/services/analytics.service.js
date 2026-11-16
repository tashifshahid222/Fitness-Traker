const mongoose = require('mongoose');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Progress = require('../models/Progress');

const DAILY_FORMAT = '%Y-%m-%d';

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const workoutAnalytics = async (userId) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const uid = toObjectId(userId);

  const [frequency, categoryDistribution, topExercises, exerciseProgress] = await Promise.all([
    Workout.aggregate([
      { $match: { userId: uid, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: DAILY_FORMAT, date: '$date' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Workout.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Workout.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: '$exerciseName', count: { $sum: 1 }, avgSets: { $avg: '$sets' }, avgReps: { $avg: '$reps' } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Workout.aggregate([
      { $match: { userId: uid, weight: { $gt: 0 } } },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: '$exerciseName',
          points: {
            $push: {
              date: { $dateToString: { format: DAILY_FORMAT, date: '$date' } },
              weight: '$weight',
            },
          },
        },
      },
      { $project: { points: { $slice: ['$points', -30] }, size: { $size: '$points' } } },
      { $sort: { size: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    frequency,
    categoryDistribution,
    topExercises,
    exerciseProgress: exerciseProgress.map((e) => ({ exerciseName: e._id, points: e.points })),
  };
};

const nutritionAnalytics = async (userId) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const uid = toObjectId(userId);

  const [daily, mealTypeDistribution, totals] = await Promise.all([
    Nutrition.aggregate([
      { $match: { userId: uid, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: DAILY_FORMAT, date: '$date' } },
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
          carbohydrates: { $sum: '$carbohydrates' },
          fats: { $sum: '$fats' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Nutrition.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: '$mealType',
          count: { $sum: 1 },
          calories: { $sum: '$calories' },
        },
      },
      { $sort: { calories: -1 } },
    ]),
    Nutrition.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: null,
          entries: { $sum: 1 },
          totalCalories: { $sum: '$calories' },
          totalProtein: { $sum: '$protein' },
          totalCarbohydrates: { $sum: '$carbohydrates' },
          totalFats: { $sum: '$fats' },
        },
      },
    ]),
  ]);

  const t = totals.length > 0 ? totals[0] : { entries: 0, totalCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFats: 0 };

  return {
    daily,
    mealTypeDistribution,
    totals: {
      entries: t.entries,
      totalCalories: t.totalCalories,
      totalProtein: t.totalProtein,
      totalCarbohydrates: t.totalCarbohydrates,
      totalFats: t.totalFats,
      macroBreakdown: [
        { name: 'Protein', grams: t.totalProtein },
        { name: 'Carbohydrates', grams: t.totalCarbohydrates },
        { name: 'Fats', grams: t.totalFats },
      ],
    },
  };
};

const progressAnalytics = async (userId, days = 30) => {
  const now = new Date();
  const since = new Date(now);
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const recent = { $gte: since };

  const [weightSeries, measurementEntries, performanceEntries] = await Promise.all([
    Progress.find({ userId, weight: { $ne: null }, date: recent }).sort({ date: 1 }).select('date weight').lean(),
    Progress.find({ userId, date: recent }).sort({ date: 1 }).select('date measurements').lean(),
    Progress.find({ userId, date: recent }).sort({ date: 1 }).select('date performance').lean(),
  ]);

  const measurementSeries = {};
  for (const entry of measurementEntries) {
    const date = entry.date;
    if (!entry.measurements) continue;
    for (const [site, value] of Object.entries(entry.measurements)) {
      if (value === undefined || value === null || Number.isNaN(Number(value))) continue;
      if (!measurementSeries[site]) measurementSeries[site] = [];
      measurementSeries[site].push({ date, value: Number(value) });
    }
  }

  const performanceSeries = {};
  for (const entry of performanceEntries) {
    for (const metric of entry.performance || []) {
      if (!performanceSeries[metric.metric]) performanceSeries[metric.metric] = [];
      performanceSeries[metric.metric].push({
        date: entry.date,
        value: metric.value,
        unit: metric.unit,
      });
    }
  }

  return {
    weightSeries: weightSeries.map((p) => ({ date: p.date, weight: p.weight })),
    measurementSeries,
    performanceSeries,
  };
};

module.exports = { workoutAnalytics, nutritionAnalytics, progressAnalytics };