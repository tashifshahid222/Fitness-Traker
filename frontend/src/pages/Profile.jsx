import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiTrash2, FiActivity, FiCalendar, FiChevronRight, FiUpload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/userService';
import ConfirmDialog from '../components/ConfirmDialog';
import { Stagger, StaggerItem, EASE } from '../components/Transitions';
import { formatDate } from '../utils/format';
import Avatar from '../components/Avatar';
import { extractError, extractFieldErrors } from '../services/api';
import '../styles/pages/profile.css';

function Profile() {
  const { user, updateUser, clearAuth } = useAuth();

  const [info, setInfo] = useState({ name: user?.name || '', username: user?.username || '', profilePicture: user?.profilePicture || '' });
  const [infoMsg, setInfoMsg] = useState('');
  const [infoErr, setInfoErr] = useState('');
  const [infoErrors, setInfoErrors] = useState({});

  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwErrors, setPwErrors] = useState({});

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteErr, setDeleteErr] = useState('');
  const [busy, setBusy] = useState(false);

  const setInfoField = (key) => (e) => setInfo((f) => ({ ...f, [key]: e.target.value }));

  const handlePicture = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setInfoErr('');
    if (!file.type.startsWith('image/')) {
      setInfoErr('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setInfoErr('Image must be smaller than 5 MB');
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      setInfo((f) => ({ ...f, profilePicture: dataUrl }));
    } catch {
      setInfoErr('Could not read that image — try another file');
    }
  };

  const handleInfo = async (e) => {
    e.preventDefault();
    const local = {};
    if (!info.name.trim()) local.name = 'Name is required';
    if (!info.username.trim()) local.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]+$/.test(info.username.trim())) local.username = 'Username may only contain letters, numbers, and underscores (no spaces)';
    setInfoErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    setInfoMsg('');
    setInfoErr('');
    try {
      const res = await userService.updateProfile(info);
      updateUser({ ...user, ...res.data.user });
      setInfoMsg('Profile updated.');
    } catch (err) {
      setInfoErr(extractError(err, 'Could not update profile'));
      setInfoErrors(extractFieldErrors(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    const local = {};
    if (!password.currentPassword) local.currentPassword = 'Enter your current password';
    if (password.newPassword.length < 8) local.newPassword = 'New password must be at least 8 characters';
    else if (password.newPassword === password.currentPassword) local.newPassword = 'New password must be different from the current password';
    setPwErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    setPwMsg('');
    setPwErr('');
    try {
      await userService.changePassword(password);
      setPwMsg('Password updated.');
      setPassword({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwErr(extractError(err, 'Could not change password'));
      setPwErrors(extractFieldErrors(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setDeleteErr('');
    try {
      await userService.deleteAccount({ password: deletePassword });
      clearAuth();
      window.location.assign('/');
    } catch (err) {
      setDeleteErr(extractError(err, 'Could not delete account'));
      setBusy(false);
    }
  };

  const prefs = user?.preferences || {};
  const joined = user?.createdAt ? formatDate(user.createdAt) : null;

  return (
    <div className="page profile-page">
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="muted">Your account details</p>
        </div>
      </div>

      <motion.div
        className="card profile-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="profile-ident">
          <Avatar user={user} className="large" />
          <div>
            <h2>{user?.name}</h2>
            <p className="muted">
              @{user?.username} · {user?.email}
            </p>
            <div className="profile-chips">
              {joined && (
                <span className="chip">
                  <FiCalendar size={12} /> Joined {joined}
                </span>
              )}
              <span className="chip accent">
                <FiActivity size={12} /> {prefs.weightUnit === 'lb' ? 'Pounds' : 'Kilograms'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <Stagger className="settings-grid" as="div">
        <StaggerItem as="div" className="card">
          <div className="card-head">
            <h2>
              <span className="stat-icon">
                <FiUser />
              </span>
              Personal information
            </h2>
          </div>
          <form onSubmit={handleInfo} className="form-stack">
            {infoMsg && <div className="alert alert-ok">{infoMsg}</div>}
            {infoErr && <div className="alert alert-error">{infoErr}</div>}
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input id="name" value={info.name} onChange={setInfoField('name')} aria-invalid={!!infoErrors.name} />
              {infoErrors.name && <p className="field-error">{infoErrors.name}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input id="username" value={info.username} onChange={setInfoField('username')} aria-invalid={!!infoErrors.username} />
              {infoErrors.username && <p className="field-error">{infoErrors.username}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="profilePicture">Profile picture</label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={handlePicture}
              />
              <div className="file-picker">
                {info.profilePicture ? (
                  <img src={info.profilePicture} alt="Profile preview" className="file-preview" />
                ) : (
                  <span className="file-preview placeholder">
                    <FiUser />
                  </span>
                )}
                <label htmlFor="profilePicture" className="btn btn-secondary btn-sm">
                  <FiUpload /> Choose file
                </label>
                {info.profilePicture && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setInfo((f) => ({ ...f, profilePicture: '' }))}
                  >
                    <FiTrash2 /> Remove
                  </button>
                )}
              </div>
              <p className="muted field-hint">JPG, PNG or WebP — resized to a small thumbnail automatically.</p>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn" disabled={busy}>
                <FiUser /> Save profile
              </button>
            </div>
          </form>
        </StaggerItem>

        <StaggerItem as="div" className="card">
          <div className="card-head">
            <h2>
              <span className="stat-icon">
                <FiActivity />
              </span>
              Fitness information
            </h2>
            <Link to="/settings" className="card-link">
              Manage <FiChevronRight />
            </Link>
          </div>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Weight unit</dt>
              <dd>{prefs.weightUnit === 'lb' ? 'Pounds (lb)' : 'Kilograms (kg)'}</dd>
            </div>
            <div className="detail-row">
              <dt>Goal alerts</dt>
              <dd>{prefs.notifications === false ? 'Off' : 'On'}</dd>
            </div>
            <div className="detail-row">
              <dt>Theme</dt>
              <dd style={{ textTransform: 'capitalize' }}>{prefs.theme || 'system'}</dd>
            </div>
          </dl>
          <p className="setting-hint" style={{ marginTop: '0.9rem', marginBottom: 0 }}>
            Units, theme and notification preferences live in Settings.
          </p>
        </StaggerItem>

        <StaggerItem as="div" className="card">
          <div className="card-head">
            <h2>
              <span className="stat-icon">
                <FiLock />
              </span>
              Security
            </h2>
          </div>
          <p className="setting-hint">Change your password to keep your account safe.</p>
          {pwMsg && <div className="alert alert-ok">{pwMsg}</div>}
          {pwErr && <div className="alert alert-error">{pwErr}</div>}
          <form onSubmit={handlePassword} className="form-stack">
            <div className="form-group">
              <label htmlFor="current-password">Current password</label>
              <div className="input-with-icon">
                <FiLock />
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={password.currentPassword}
                  onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
                  aria-invalid={!!pwErrors.currentPassword}
                />
              </div>
              {pwErrors.currentPassword && <p className="field-error">{pwErrors.currentPassword}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <div className="input-with-icon">
                <FiLock />
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password.newPassword}
                  onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                  aria-invalid={!!pwErrors.newPassword}
                />
              </div>
              {pwErrors.newPassword && <p className="field-error">{pwErrors.newPassword}</p>}
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-secondary" disabled={busy}>
                Update password
              </button>
            </div>
          </form>
        </StaggerItem>

        <StaggerItem as="div" className="card danger-zone">
          <div className="card-head">
            <h2>
              <span className="stat-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <FiTrash2 />
              </span>
              Danger zone
            </h2>
          </div>
          <p className="muted">
            Deleting your account removes you, your workouts, nutrition, progress, goals, notifications, and tickets permanently.
          </p>
          <p className="muted">Your data will be deleted forever!</p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              setDeleteOpen(true);
              setDeleteErr('');
              setDeletePassword('');
            }}
          >
            <FiTrash2 /> Delete account
          </button>
        </StaggerItem>
      </Stagger>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete account?"
        message={
          <span className="dialog-msg">
            <span className="dialog-msg-text">
              This action <strong>cannot be undone</strong>. Enter your password to confirm.
            </span>
            <span className="form-group">
              <label htmlFor="delete-password">Password</label>
              <input id="delete-password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
            </span>
            {deleteErr && <span className="alert alert-error">{deleteErr}</span>}
          </span>
        }
        confirmLabel="Delete my account"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        busy={busy}
      />
    </div>
  );
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 256;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    img.src = url;
  });
}

export default Profile;
