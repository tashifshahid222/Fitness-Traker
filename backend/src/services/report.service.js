const PDFDocument = require('pdfkit');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Progress = require('../models/Progress');

const REPORT_TYPES = ['workouts', 'nutrition', 'progress'];

const LB_PER_KG = 2.20462;
const toDisplayWeight = (kg, unit) => (unit === 'lb' ? Number(kg) * LB_PER_KG : Number(kg));
const formatWeightValue = (kg, unit) =>
  kg === null || kg === undefined || kg === '' ? '' : Math.round(toDisplayWeight(kg, unit) * 10) / 10;

const toIsoDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().slice(0, 10);
};

const generateWorkoutReport = async (userId) => Workout.find({ userId }).sort({ date: -1 }).lean();

const generateNutritionReport = async (userId) => Nutrition.find({ userId }).sort({ date: -1 }).lean();

const generateProgressReport = async (userId) => Progress.find({ userId }).sort({ date: -1 }).lean();

const summarizeWorkouts = (rows) => {
  const categoryMap = {};
  const exerciseMap = {};
  for (const row of rows) {
    categoryMap[row.category] = (categoryMap[row.category] || 0) + 1;
    exerciseMap[row.exerciseName] = (exerciseMap[row.exerciseName] || 0) + 1;
  }
  const categories = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  const exercises = Object.entries(exerciseMap)
    .map(([exerciseName, count]) => ({ exerciseName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const withWeight = rows.filter((r) => r.weight > 0);
  return {
    totalWorkouts: rows.length,
    categories,
    exercises,
    avgSetsPerWorkout: rows.length ? Math.round((rows.reduce((s, r) => s + (r.sets || 0), 0) / rows.length) * 10) / 10 : 0,
    weightSessions: withWeight.length,
  };
};

const summarizeNutrition = (rows) => {
  const mealMap = {};
  for (const row of rows) {
    mealMap[row.mealType] = (mealMap[row.mealType] || 0) + 1;
  }
  const daysLogged = new Set(rows.map((r) => toIsoDate(r.date))).size;
  return {
    totalEntries: rows.length,
    daysLogged,
    avgEntriesPerDay: daysLogged ? Math.round((rows.length / daysLogged) * 10) / 10 : 0,
    totalCalories: rows.reduce((s, r) => s + (r.calories || 0), 0),
    totalProtein: rows.reduce((s, r) => s + (r.protein || 0), 0),
    totalCarbohydrates: rows.reduce((s, r) => s + (r.carbohydrates || 0), 0),
    totalFats: rows.reduce((s, r) => s + (r.fats || 0), 0),
    meals: Object.entries(mealMap)
      .map(([mealType, count]) => ({ mealType, count }))
      .sort((a, b) => b.count - a.count),
  };
};

const summarizeProgress = (rows) => {
  if (rows.length === 0) {
    return { totalEntries: 0, firstWeight: null, latestWeight: null, weightDelta: null, latestMeasurements: null };
  }
  const weightEntries = rows.filter((r) => r.weight !== undefined && r.weight !== null);
  const latest = rows[0];
  return {
    totalEntries: rows.length,
    firstWeight: weightEntries.length ? weightEntries[weightEntries.length - 1].weight : null,
    latestWeight: weightEntries.length ? weightEntries[0].weight : null,
    weightDelta: weightEntries.length > 1 ? Math.round((weightEntries[0].weight - weightEntries[weightEntries.length - 1].weight) * 100) / 100 : null,
    bodyMeasurements: latest.measurements || {},
    latestPerformance: latest.performance || [],
  };
};

const buildReportData = async (userId, type) => {
  if (!REPORT_TYPES.includes(type)) {
    return null;
  }
  if (type === 'workouts') {
    const rows = await generateWorkoutReport(userId);
    return { type: 'workouts', title: 'Workout Report', summary: summarizeWorkouts(rows), rows };
  }
  if (type === 'nutrition') {
    const rows = await generateNutritionReport(userId);
    return { type: 'nutrition', title: 'Nutrition Report', summary: summarizeNutrition(rows), rows };
  }
  const rows = await generateProgressReport(userId);
  return { type: 'progress', title: 'Progress Report', summary: summarizeProgress(rows), rows };
};

const toCSV = (columns, rows) => {
  const escape = (value) => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => escape(c.label)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(c.value(row))).join(','));
  }
  return lines.join('\r\n');
};

const buildCsvColumns = (unit) => ({
  workouts: [
    { label: 'date', value: (r) => r.date },
    { label: 'exercise_name', value: (r) => r.exerciseName },
    { label: 'category', value: (r) => r.category },
    { label: 'sets', value: (r) => r.sets },
    { label: 'reps', value: (r) => r.reps },
    { label: `weight (${unit})`, value: (r) => formatWeightValue(r.weight, unit) },
    { label: 'tags', value: (r) => (r.tags || []).join(';') },
    { label: 'notes', value: (r) => r.notes },
  ],
  nutrition: [
    { label: 'date', value: (r) => r.date },
    { label: 'meal_type', value: (r) => r.mealType },
    { label: 'food_items', value: (r) => (r.foodItems || []).join(';') },
    { label: 'quantity', value: (r) => r.quantity },
    { label: 'calories', value: (r) => r.calories },
    { label: 'protein', value: (r) => r.protein },
    { label: 'carbohydrates', value: (r) => r.carbohydrates },
    { label: 'fats', value: (r) => r.fats },
    { label: 'notes', value: (r) => r.notes },
  ],
  progress: [
    { label: 'date', value: (r) => r.date },
    { label: `weight (${unit})`, value: (r) => (r.weight === undefined ? '' : formatWeightValue(r.weight, unit)) },
    { label: 'chest', value: (r) => r.measurements?.chest ?? '' },
    { label: 'waist', value: (r) => r.measurements?.waist ?? '' },
    { label: 'hips', value: (r) => r.measurements?.hips ?? '' },
    { label: 'arms', value: (r) => r.measurements?.arms ?? '' },
    { label: 'thighs', value: (r) => r.measurements?.thighs ?? '' },
    { label: 'performance', value: (r) => (r.performance || []).map((p) => `${p.metric}:${p.value}${p.unit}`).join(';') },
    { label: 'notes', value: (r) => r.notes },
  ],
});

const buildCSV = async (userId, type, unit = 'kg') => {
  const data = await buildReportData(userId, type);
  if (!data) return null;
  return toCSV(buildCsvColumns(unit)[type], data.rows);
};

const buildPDF = (title, sections) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).text(`Generated on ${new Date().toUTCString()}`, { align: 'center' });
    doc.moveDown(1.2);

    for (const section of sections) {
      doc.fontSize(14).text(section.title);
      doc.moveDown(0.4);
      if (section.keyValues) {
        for (const [key, value] of Object.entries(section.keyValues)) {
          doc.fontSize(10).text(`  ${key}: ${value}`);
        }
      }
      if (section.rows && section.rows.length > 0) {
        for (const row of section.rows) {
          doc.fontSize(9).text(`  ${row}`);
        }
      } else if (section.rows) {
        doc.fontSize(9).text('  No records found.');
      }
      doc.moveDown(0.8);
    }

    doc.end();
  });

const buildReportPDF = async (userId, type, unit = 'kg') => {
  const data = await buildReportData(userId, type);
  if (!data) return null;
  const { summary } = data;

  const keyValues = {
    'Entries / workouts': summary.totalWorkouts ?? summary.totalEntries,
    ...(summary.avgSetsPerWorkout !== undefined && { 'Average sets per workout': summary.avgSetsPerWorkout }),
    ...(summary.weightSessions !== undefined && { 'Sessions with weight': summary.weightSessions }),
    ...(summary.categories && { 'Category breakdown': summary.categories.map((c) => `${c.category} (${c.count})`).join(', ') }),
    ...(summary.daysLogged !== undefined && { 'Days logged': summary.daysLogged }),
    ...(summary.avgEntriesPerDay !== undefined && { 'Average entries per day': summary.avgEntriesPerDay }),
    ...(summary.totalCalories !== undefined && { 'Total calories': summary.totalCalories }),
    ...(summary.totalProtein !== undefined && { 'Total protein (g)': summary.totalProtein }),
    ...(summary.totalCarbohydrates !== undefined && { 'Total carbohydrates (g)': summary.totalCarbohydrates }),
    ...(summary.totalFats !== undefined && { 'Total fats (g)': summary.totalFats }),
    ...(summary.firstWeight && { [`Starting weight (${unit})`]: formatWeightValue(summary.firstWeight, unit) }),
    ...(summary.latestWeight && { [`Latest weight (${unit})`]: formatWeightValue(summary.latestWeight, unit) }),
    ...(summary.weightDelta != null && { [`Weight change (${unit})`]: formatWeightValue(summary.weightDelta, unit) }),
  };

  const recentRows = data.rows
    .slice(0, 25)
    .map((row) => {
      if (data.type === 'workouts') {
        return `${toIsoDate(row.date)} | ${row.exerciseName} | ${row.category} | ${row.sets}x${row.reps} @ ${formatWeightValue(row.weight, unit)}${unit}`;
      }
      if (data.type === 'nutrition') {
        return `${toIsoDate(row.date)} | ${row.mealType} | ${(row.foodItems || []).join(', ')} | ${row.calories} kcal`;
      }
      const perf = (row.performance || []).map((p) => `${p.metric}: ${p.value}${p.unit}`).join(', ');
      return `${toIsoDate(row.date)} | ${row.weight !== undefined ? `${formatWeightValue(row.weight, unit)} ${unit}` : 'no weight'} | ${perf}`;
    });

  return buildPDF(data.title, [
    { title: 'Summary', keyValues },
    { title: data.type === 'progress' ? 'Recent entries' : 'Recent records', rows: recentRows },
  ]);
};

module.exports = { buildReportData, buildCSV, buildReportPDF, REPORT_TYPES };