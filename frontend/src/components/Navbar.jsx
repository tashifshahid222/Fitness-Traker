import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLogout } from '../hooks/useLogout';
import Avatar from '../components/Avatar';
import { FiLogOut, FiSun, FiMoon } from 'react-icons/fi';

function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { logout: handleLogout } = useLogout();
  const isDark = theme === 'dark';

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to="/" className="nav-brand">
        <span className="logo-mark">F</span>
        <span className="nav-brand-text">Fitness Tracker</span>
      </Link>
      <div className="nav-links">
        <button
          type="button"
          className="icon-btn"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        >
          {isDark ? <FiMoon /> : <FiSun />}
        </button>
        {user ? (
          <>
            <Link to="/profile" className="nav-link">
              <Avatar user={user} className="sm" />
              <span className="nav-user-name">{user.username}</span>
            </Link>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <FiLogOut size={14} /> Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Log in
            </Link>
            <Link to="/register" className="btn">
              Get started
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}

export default Navbar;
