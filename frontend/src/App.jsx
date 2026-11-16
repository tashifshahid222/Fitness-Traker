import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Workouts = lazy(() => import('./pages/Workouts.jsx'));
const WorkoutForm = lazy(() => import('./pages/WorkoutForm.jsx'));
const WorkoutDetails = lazy(() => import('./pages/WorkoutDetails.jsx'));
const Nutrition = lazy(() => import('./pages/Nutrition.jsx'));
const NutritionForm = lazy(() => import('./pages/NutritionForm.jsx'));
const NutritionDetails = lazy(() => import('./pages/NutritionDetails.jsx'));
const ProgressPage = lazy(() => import('./pages/ProgressPage.jsx'));
const ProgressDetails = lazy(() => import('./pages/ProgressDetails.jsx'));
const Goals = lazy(() => import('./pages/Goals.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Support = lazy(() => import('./pages/Support.jsx'));

function App() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const isPublicPath = ['/', '/login', '/register'].includes(pathname);
  const hasSessionHint = sessionStorage.getItem('fitnessTrackerAuthenticated') === 'true';

  if (loading && (!isPublicPath || (pathname === '/' && hasSessionHint))) {
    return (
      <div className="boot-screen">
        <LoadingSpinner label="Starting up…" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="boot-screen">
          <LoadingSpinner label="Loading page…" />
        </div>
      }
    >
      <Routes>
        {user ? (
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/new" element={<WorkoutForm />} />
            <Route path="/workouts/:id" element={<WorkoutDetails />} />
            <Route path="/workouts/:id/edit" element={<WorkoutForm />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/nutrition/new" element={<NutritionForm />} />
            <Route path="/nutrition/:id" element={<NutritionDetails />} />
            <Route path="/nutrition/:id/edit" element={<NutritionForm />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/progress/:id" element={<ProgressDetails />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="/login" element={<Dashboard />} />
            <Route path="/register" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        ) : (
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        )}
      </Routes>
    </Suspense>
  );
}

export default App;