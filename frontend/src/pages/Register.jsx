import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiCheck, FiShield } from 'react-icons/fi';
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
        <h2>Start tracking today.</h2>
        <p>Create a free account and log your first workout in under a minute.</p>
        <ul className="auth-points">
          <li>
            <span className="tick">
              <FiCheck />
            </span>
            Free, no card required
          </li>
          <li>
            <span className="tick">
              <FiCheck />
            </span>
            Workouts, meals and weight in one place
          </li>
          <li>
            <span className="tick">
              <FiCheck />
            </span>
            Set goals and watch progress update on its own
          </li>
        </ul>
      </div>
      <p className="auth-aside-foot">Your data stays private. Always.</p>
    </aside>
  );
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
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

    const local = {};
    if (!form.name.trim()) local.name = 'Full name is required';
    else if (form.name.trim().length < 2) local.name = 'Name must be at least 2 characters';
    if (!form.username.trim()) local.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) local.username = 'Username may only contain letters, numbers, and underscores (no spaces)';
    if (!form.email.trim()) local.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) local.email = 'Enter a valid email address';
    if (form.password !== form.confirmPassword) local.confirmPassword = 'Passwords do not match';
    if (form.password.length < 8) local.password = 'Password must be at least 8 characters';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: form.name, username: form.username, email: form.email, password: form.password });
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(extractError(err, 'Registration failed'));
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
          <h1>Create your account</h1>
          <p className="auth-sub muted">Free forever. No card required.</p>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <Stagger as="div">
              <StaggerItem as="div" className="form-group">
                <label htmlFor="name">Full name</label>
                <div className="input-with-icon">
                  <FiUser />
                  <input
                    id="name"
                    value={form.name}
                    onChange={set('name')}
                    aria-invalid={!!errors.name}
                    placeholder="Alex Doe"
                  />
                </div>
                {errors.name && <p className="field-error">{errors.name}</p>}
              </StaggerItem>

              <StaggerItem as="div" className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={form.username}
                  onChange={set('username')}
                  aria-invalid={!!errors.username}
                  placeholder="alex_doe"
                />
                {errors.username && <p className="field-error">{errors.username}</p>}
              </StaggerItem>

              <StaggerItem as="div" className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <FiMail />
                  <input
                    id="email"
                    type="email"
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
                    value={form.password}
                    onChange={set('password')}
                    aria-invalid={!!errors.password}
                    placeholder="At least 8 characters"
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

              <StaggerItem as="div" className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="input-with-icon">
                  <FiLock />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    aria-invalid={!!errors.confirmPassword}
                    placeholder="Repeat password"
                  />
                </div>
                {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
              </StaggerItem>
            </Stagger>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <button type="submit" className="btn btn-block btn-lg" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </motion.div>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
