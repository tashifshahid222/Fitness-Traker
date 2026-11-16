const mongoose = require('mongoose');
const { env } = require('./config/env');
const User = require('./models/User');
const Workout = require('./models/Workout');
const Nutrition = require('./models/Nutrition');
const Progress = require('./models/Progress');
const Goal = require('./models/Goal');
const Notification = require('./models/Notification');
const SupportTicket = require('./models/SupportTicket');

const START = new Date(2026, 8, 10);
const END = new Date(2026, 9, 22);

let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const round1 = (n) => Math.round(n * 10) / 10;

const eachDay = (start, end) => {
  const days = [];
  const d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
};

const STRENGTH = [
  ['Bench Press', 3],
  ['Squat', 4],
  ['Deadlift', 3],
  ['Overhead Press', 3],
  ['Barbell Row', 3],
  ['Pull Up', 4],
  ['Dumbbell Curl', 3],
  ['Tricep Pushdown', 3],
  ['Lunges', 3],
  ['Leg Press', 4],
];
const CARDIO = [
  ['Running', 0],
  ['Cycling', 0],
  ['Jump Rope', 0],
  ['Swimming', 0],
  ['Elliptical', 0],
];
const OTHER = [
  ['Yoga Flow', 0],
  ['Plank Hold', 0],
  ['Basketball', 0],
  ['Stretching', 0],
];

const MEALS = {
  breakfast: [
    [['Oatmeal with banana', 'Boiled eggs'], 420, 20, 55, 12, '2 bowls oatmeal, 2 eggs'],
    [['Paratha', 'Tea with milk'], 550, 12, 60, 25, '2 small parathas'],
    [['Greek yogurt', 'Granola', 'Berries'], 380, 22, 48, 10, ''],
    [['Toast with peanut butter', 'Banana'], 450, 16, 50, 18, ''],
    [['Omelette', 'Whole wheat toast'], 400, 24, 30, 18, '3-egg omelette'],
  ],
  lunch: [
    [['Chicken breast', 'Brown rice', 'Salad'], 620, 45, 65, 16, 'Grilled chicken 200g'],
    [['Beef curry', 'Naan'], 750, 40, 70, 30, '1 naan'],
    [['Lentil dal', 'Rice', 'Raita'], 580, 22, 85, 14, ''],
    [['Tuna sandwich', 'Fruit'], 480, 32, 55, 12, ''],
    [['Grilled fish', 'Quinoa', 'Vegetables'], 560, 42, 50, 15, ''],
    [['Chicken biryani', 'Salad'], 700, 38, 78, 24, '1 plate'],
  ],
  dinner: [
    [['Grilled chicken', 'Sweet potato', 'Broccoli'], 580, 48, 55, 14, ''],
    [['Salmon', 'Steamed rice', 'Green beans'], 620, 40, 52, 22, ''],
    [['Beef stir fry', 'Noodles'], 650, 42, 62, 20, ''],
    [['Paneer curry', 'Roti'], 600, 25, 65, 26, '2 rotis'],
    [['Turkey meatballs', 'Pasta'], 640, 40, 68, 18, ''],
    [['Chicken soup', 'Whole wheat bread'], 420, 30, 45, 10, 'Light dinner'],
  ],
  snack: [
    [['Protein shake', 'Almonds'], 280, 30, 15, 10, '1 scoop whey'],
    [['Apple', 'Peanut butter'], 250, 6, 30, 12, ''],
    [['Greek yogurt'], 150, 15, 12, 4, ''],
    [['Trail mix'], 220, 8, 24, 12, 'Small handful'],
    [['Boiled eggs', 'Fruit'], 200, 14, 15, 8, '2 eggs'],
    [['Popcorn'], 180, 5, 30, 4, 'Air-popped'],
  ],
};

const asyncMain = async () => {
  if (!env.MONGO_URI) {
    console.error('MONGO_URI is not set — cannot seed');
    process.exit(1);
  }

  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');

  const email = 'fitnesstracker@gmail.com';
  const username = 'fitnesstracker';

  let user = await User.findOne({ $or: [{ email }, { username }] });
  if (user) {
    console.log(`User already exists: ${user.email} — clearing old seed data`);
    await Promise.all([
      Workout.deleteMany({ userId: user._id }),
      Nutrition.deleteMany({ userId: user._id }),
      Progress.deleteMany({ userId: user._id }),
      Goal.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      SupportTicket.deleteMany({ userId: user._id }),
    ]);
  } else {
    user = await User.create({
      name: 'Fitness Tracker',
      username,
      email,
      password: 'fitness1234',
      preferences: { theme: 'system', weightUnit: 'kg', notifications: true },
    });
    console.log(`Created user: ${email} / fitness1234`);
  }

  const days = eachDay(START, END);
  const userId = user._id;

  // ---------- Workouts ----------
  const workouts = [];
  for (const day of days) {
    const dow = day.getDay();
    if (dow === 0) continue; // rest day Sundays
    const sessions = rand() < 0.25 ? 2 : 1;
    for (let s = 0; s < sessions; s++) {
      const roll = rand();
      if (roll < 0.55) {
        const [name] = pick(STRENGTH);
        workouts.push({
          userId,
          exerciseName: name,
          category: 'strength',
          sets: randInt(3, 5),
          reps: randInt(6, 12),
          weight: randInt(40, 120),
          notes: pick(['Felt strong today', '', 'Last set to failure', 'Good form']),
          tags: ['gym'],
          date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), randInt(17, 21), randInt(0, 59)),
        });
      } else if (roll < 0.8) {
        const [name] = pick(CARDIO);
        workouts.push({
          userId,
          exerciseName: name,
          category: 'cardio',
          sets: 0,
          reps: 0,
          weight: 0,
          notes: pick(['Steady pace', '', 'Intervals today', 'PR attempt']),
          tags: ['cardio'],
          date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), randInt(6, 9), randInt(0, 59)),
        });
      } else {
        const [name] = pick(OTHER);
        workouts.push({
          userId,
          exerciseName: name,
          category: name === 'Yoga Flow' || name === 'Stretching' || name === 'Plank Hold' ? 'flexibility' : name === 'Basketball' ? 'sports' : 'other',
          sets: name === 'Plank Hold' ? 3 : 0,
          reps: name === 'Plank Hold' ? 1 : 0,
          weight: 0,
          notes: '',
          tags: ['recovery'],
          date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), randInt(18, 22), randInt(0, 59)),
        });
      }
    }
  }

  // ---------- Nutrition ----------
  const nutrition = [];
  for (const day of days) {
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    if (rand() < 0.7) mealTypes.push('snack');
    for (const mealType of mealTypes) {
      const [foodItems, calories, protein, carbohydrates, fats, quantity] = pick(MEALS[mealType]);
      nutrition.push({
        userId,
        mealType,
        foodItems,
        quantity: quantity || pick(['1 serving', '1 plate', '200 g', '']),
        calories,
        protein,
        carbohydrates,
        fats,
        notes: rand() < 0.15 ? pick(['Cheat meal', 'Home cooked', 'Meal prep']) : '',
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), { breakfast: 8, lunch: 13, dinner: 20, snack: 16 }[mealType], randInt(0, 45)),
      });
    }
  }

  // ---------- Progress ----------
  const progress = [];
  let weight = 82.5;
  for (let i = 0; i < days.length; i += 3) {
    const day = days[i];
    weight = round1(Math.max(76, weight - (rand() * 0.5 - 0.15)));
    const entry = {
      userId,
      weight,
      date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, randInt(0, 30)),
      notes: i % 9 === 0 ? 'Morning weigh-in' : '',
    };
    if (i % 12 === 0) {
      entry.measurements = {
        chest: randInt(98, 104),
        waist: randInt(82, 90),
        hips: randInt(96, 101),
        arms: randInt(33, 37),
        thighs: randInt(55, 60),
      };
    }
    if (i % 15 === 0) {
      entry.performance = [
        { metric: 'Bench Press 1RM', value: randInt(80, 95), unit: 'kg' },
        { metric: 'Plank Max', value: randInt(60, 150), unit: 'sec' },
      ];
    }
    progress.push(entry);
  }

  // ---------- Goals ----------
  const goals = [
    {
      userId,
      title: 'Lose 5 kg',
      description: 'Cut down from 82.5 kg to 77.5 kg by end of October',
      targetValue: 5,
      currentValue: 2.4,
      unit: 'kg',
      deadline: new Date(2026, 9, 31),
      status: 'active',
    },
    {
      userId,
      title: 'Bench press 100 kg',
      description: 'Hit a 100 kg single on bench press',
      targetValue: 100,
      currentValue: 92,
      unit: 'kg',
      deadline: new Date(2026, 11, 15),
      status: 'active',
    },
    {
      userId,
      title: 'Run 100 km this month',
      description: 'Total running distance in September',
      targetValue: 100,
      currentValue: 100,
      unit: 'km',
      deadline: new Date(2026, 8, 30),
      status: 'completed',
    },
    {
      userId,
      title: 'Workout 4x a week',
      description: 'Average 4 workouts per week for 6 weeks',
      targetValue: 24,
      currentValue: 18,
      unit: 'workouts',
      deadline: new Date(2026, 9, 12),
      status: 'active',
    },
    {
      userId,
      title: '2000 kcal daily average',
      description: 'Keep daily calories near 2000 kcal',
      targetValue: 30,
      currentValue: 22,
      unit: 'days',
      deadline: new Date(2026, 9, 9),
      status: 'active',
    },
  ];

  // ---------- Notifications ----------
  const notifications = [
    {
      userId,
      type: 'goal',
      title: 'Goal achieved: Run 100 km this month',
      message: 'Congratulations! You hit 100 km of running in September.',
      isRead: false,
    },
    {
      userId,
      type: 'reminder',
      title: 'Deadline coming up',
      message: 'Your goal "Workout 4x a week" deadline is on 12 Oct 2026.',
      isRead: false,
    },
    {
      userId,
      type: 'workout',
      title: 'Weekly streak!',
      message: 'You logged workouts 5 days in a row. Keep it up!',
      isRead: true,
    },
    {
      userId,
      type: 'system',
      title: 'Welcome to Fitness Tracker',
      message: 'Your account is ready. Start logging workouts and meals!',
      isRead: true,
    },
  ];

  // ---------- Support tickets ----------
  const tickets = [
    {
      userId,
      subject: 'Question about macro targets',
      message: 'How are daily macro totals calculated on the dashboard?',
      type: 'question',
      priority: 'low',
      status: 'closed',
    },
    {
      userId,
      subject: 'Chart looks wrong on analytics page',
      message: 'The weight trend chart skipped a few days instead of showing gaps.',
      type: 'problem',
      priority: 'medium',
      status: 'open',
    },
  ];

  const [wRes, nRes, pRes, gRes, notifRes, tRes] = await Promise.all([
    Workout.insertMany(workouts),
    Nutrition.insertMany(nutrition),
    Progress.insertMany(progress),
    Goal.insertMany(goals),
    Notification.insertMany(notifications),
    SupportTicket.insertMany(tickets),
  ]);

  console.log('Seed complete:');
  console.log(`  Workouts:        ${wRes.length}`);
  console.log(`  Nutrition logs:  ${nRes.length}`);
  console.log(`  Progress entry:  ${pRes.length}`);
  console.log(`  Goals:           ${gRes.length}`);
  console.log(`  Notifications:   ${notifRes.length}`);
  console.log(`  Support tickets: ${tRes.length}`);
  console.log(`  Date range:      ${START.toDateString()} → ${END.toDateString()}`);
  console.log('Login: fitnesstracker@gmail.com / fitness1234');

  await mongoose.disconnect();
};

asyncMain().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
