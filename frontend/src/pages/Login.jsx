import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLock, FiMail, FiCheck } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { extractError, extractFieldErrors } from '../services/api';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';

function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-body">
        <Link to="/" className="auth-brand">
          <span className="lp-mark" aria-hidden="true">F<span /></span>
          <span>
            Fitness<span className="lp-brand-light"> Tracker</span>
            <span className="lp-brand-period">.</span>
          </span>
        </Link>
        <h2>Welcome back.</h2>
        <p>Pick up where you left off. Your workouts, meals and progress are waiting.</p>
        <ul className="auth-points">
          <li>
            <span className="tick">
              <FiCheck />
            </span>
           Log today's workout
          </li>
          <li>
            <span className="tick">
              <FiCheck />
            </span>
            Track calories and macros
          </li>
          <li>
            <span className="tick">
              <FiCheck />
            </span>
            See your progress over time
          </li>
        </ul>
      </div>
      <p className="auth-aside-foot">Consistency beats intensity.</p>
    </aside>
  );
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(extractError(err, 'Login failed'));
      setErrors(extractFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-main">
        <motion.div
          className="auth-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <Link to="/" className="auth-brand">
            <span className="lp-mark" aria-hidden="true">F<span /></span>
            <span>
              Fitness<span className="lp-brand-light"> Tracker</span>
              <span className="lp-brand-period">.</span>
            </span>
          </Link>
          <h1>Welcome back</h1>
          <p className="auth-sub muted">Log in to your fitness journey.</p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <Stagger as="div">
              <StaggerItem as="div" className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <FiMail />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    aria-invalid={!!errors.email}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="field-error">{errors.email}</p>}
              </StaggerItem>

              <StaggerItem as="div" className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <FiLock />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={set('password')}
                    aria-invalid={!!errors.password}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
                {errors.password && <p className="field-error">{errors.password}</p>}
              </StaggerItem>
            </Stagger>

            <div>
              <button type="submit" className="btn btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Logging in…' : 'Log in'}
              </button>
            </div>
          </form>

          <p className="auth-switch">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
