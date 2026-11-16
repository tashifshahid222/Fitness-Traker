const mongoose = require('mongoose');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Progress = require('../models/Progress');
const Goal = require('../models/Goal');

const toIsoDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfLocalDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getDashboard = async (userId) => {
  const now = new Date();
  const startOfDay = startOfLocalDay(now);
  const weekAgo = new Date(startOfDay);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const thirtyDaysAgo = new Date(startOfDay);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const userIdObj = new mongoose.Types.ObjectId(userId);

  const [
    workoutsLast7Days,
    todayTotals,
    latestWeightEntry,
    rawActiveGoals,
    recentWorkouts,
    recentNutrition,
    recentProgress,
    weeklyWorkoutCounts,
    weightTrend,
  ] = await Promise.all([
    Workout.countDocuments({ userId, date: { $gte: weekAgo } }),
    Nutrition.aggregate([
      { $match: { userId: userIdObj, date: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
          carbohydrates: { $sum: '$carbohydrates' },
          fats: { $sum: '$fats' },
        },
      },
    ]),
    Progress.findOne({ userId, weight: { $ne: null } })
      .sort({ date: -1 })
      .select('date weight')
      .lean(),
    Goal.find({ userId, status: 'active' }).sort({ deadline: 1 }).limit(5).lean(),
    Workout.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    Nutrition.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    Progress.find({ userId }).sort({ date: -1 }).limit(5).lean(),
    Workout.aggregate([
      { $match: { userId: userIdObj, date: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Progress.find({ userId, weight: { $ne: null }, date: { $gte: thirtyDaysAgo } })
      .sort({ date: 1 })
      .select('date weight')
      .lean(),
  ]);

  const weeklyWorkouts = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    const key = toIsoDate(d);
    const found = weeklyWorkoutCounts.find((w) => w._id === key);
    weeklyWorkouts.push({ date: key, count: found ? found.count : 0 });
  }

  const activeGoals = rawActiveGoals.map((g) => ({
    ...g,
    progressPercent: g.targetValue
      ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
      : 0,
  }));

  return {
    summary: {
      workoutsLast7Days,
      caloriesToday: todayTotals.length > 0 ? todayTotals[0].calories : 0,
      macrosToday: {
        protein: todayTotals.length > 0 ? todayTotals[0].protein : 0,
        carbohydrates: todayTotals.length > 0 ? todayTotals[0].carbohydrates : 0,
        fats: todayTotals.length > 0 ? todayTotals[0].fats : 0,
      },
      currentWeight: latestWeightEntry ? latestWeightEntry.weight : null,
      currentWeightDate: latestWeightEntry ? latestWeightEntry.date : null,
      activeGoalsCount: activeGoals.length,
    },
    weeklyWorkouts,
    weightTrend: weightTrend.map((p) => ({ date: toIsoDate(p.date), weight: p.weight })),
    recentWorkouts,
    recentNutrition,
    recentProgress,
    activeGoals,
  };
};

module.exports = { getDashboard };