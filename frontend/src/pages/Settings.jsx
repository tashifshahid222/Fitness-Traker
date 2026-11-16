import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor, FiBell, FiTrendingUp, FiDroplet } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../context/ToastContext';
import userService from '../services/userService';
import { EASE } from '../components/Transitions';
import { extractError } from '../services/api';
import '../styles/pages/settings.css';

const THEMES = [
  { key: 'light', label: 'Light', icon: <FiSun /> },
  { key: 'dark', label: 'Dark', icon: <FiMoon /> },
  { key: 'system', label: 'System', icon: <FiMonitor /> },
];

function Settings() {
  const { user, updateUser } = useAuth();
  const { preference: theme, setPreference } = useTheme();
  const toast = useToast();
  const prefs = user?.preferences || {};

  const [weightUnit, setWeightUnit] = useState(prefs.weightUnit || 'kg');
  const [notifications, setNotifications] = useState(prefs.notifications ?? true);
  const [saving, setSaving] = useState(null);
  const [err, setErr] = useState('');
  const savedTheme = prefs.theme;

  useEffect(() => {
    if (['light', 'dark', 'system'].includes(savedTheme)) {
      setPreference(savedTheme);
    }
  }, [savedTheme, setPreference]);

  const save = async (patch, label) => {
    setSaving(label);
    setErr('');
    try {
      const res = await userService.updatePreferences(patch);
      updateUser({ ...user, preferences: res.data.user.preferences });
      toast.success('Preferences saved', 'Your settings were updated.');
    } catch (e) {
      setErr(extractError(e, 'Could not save preferences'));
    } finally {
      setSaving(null);
    }
  };

  const cardMotion = (delay) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE, delay },
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Personalize your experience</p>
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      <div className="settings-grid">
        <motion.div className="card" {...cardMotion(0)}>
          <div className="card-head">
            <h2>
              <span className="stat-icon">
                <FiDroplet />
              </span>
              Appearance
            </h2>
          </div>
          <div className="setting-row">
            <span className="setting-label">Theme</span>
            <div className="segmented">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`segment ${theme === t.key ? 'active' : ''}`}
                  onClick={() => setPreference(t.key)}
                  disabled={saving === 'theme'}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-hint">
            Theme applies immediately. Saving is optional — select <em>Save theme</em> below.
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" disabled={saving !== null} onClick={() => save({ theme }, 'theme')}>
              {saving === 'theme' ? 'Saving…' : 'Save theme'}
            </button>
          </div>
        </motion.div>

        <motion.div className="card" {...cardMotion(0.15)}>
          <div className="card-head">
            <h2>
              <span className="stat-icon">
                <FiTrendingUp />
              </span>
              Units
            </h2>
          </div>
          <div className="setting-row">
            <span className="setting-label">Weight unit</span>
            <div className="segmented">
              <button
                type="button"
                className={`segment ${weightUnit === 'kg' ? 'active' : ''}`}
                disabled={saving === 'weightUnit'}
                onClick={() => {
                  setWeightUnit('kg');
                  save({ weightUnit: 'kg' }, 'weightUnit');
                }}
              >
                kg
              </button>
              <button
                type="button"
                className={`segment ${weightUnit === 'lb' ? 'active' : ''}`}
                disabled={saving === 'weightUnit'}
                onClick={() => {
                  setWeightUnit('lb');
                  save({ weightUnit: 'lb' }, 'weightUnit');
                }}
              >
                lb
              </button>
            </div>
          </div>
          <div className="setting-hint">Weight entries are stored in kg on the server. This picker personalizes display units and saves immediately.</div>
        </motion.div>

        <motion.div className="card" {...cardMotion(0.3)}>
          <div className="card-head">
            <h2>
              <span className="stat-icon">
                <FiBell />
              </span>
              Notifications
            </h2>
          </div>
          <div className="setting-row">
            <span className="setting-label">Goal alerts & reminders</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => {
                  setNotifications(e.target.checked);
                  save({ notifications: e.target.checked }, 'notifications');
                }}
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          </div>
          <div className="setting-hint">
            Get notified in-app when you achieve a goal and when deadlines are approaching.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;
