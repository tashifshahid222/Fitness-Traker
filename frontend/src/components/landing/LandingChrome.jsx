import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export function LandingBrand() {
  return (
    <Link to="/" className="lp-brand" aria-label="Fitness Tracker home">
      <span className="lp-mark" aria-hidden="true">
        F<span />
      </span>
      <span>
        Fitness<span className="lp-brand-light"> Tracker</span>
        <span className="lp-brand-period">.</span>
      </span>
    </Link>
  );
}
export function LandingNav() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const isDark = theme === 'dark';
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <header className="lp-header">
      <a className="lp-skip-link" href="#landing-content">
        Skip to content
      </a>
      <nav className="lp-nav lp-container" aria-label="Main navigation">
        <LandingBrand />
        <div className="lp-nav-center">
          <Link to="/#features">Features</Link>
          <Link to="/#analytics">Your progress</Link>
          <Link to="/#how-it-works">How it works</Link>
        </div>
        <div className="lp-nav-actions">
          <button
            type="button"
            className="lp-icon-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <FiMoon /> : <FiSun />}
          </button>
          {!user && (
            <>
              <Link to="/login" className="lp-login-link">
                Log in
              </Link>
              <Link to="/register" className="lp-button lp-nav-cta">
                Get started <FiArrowUpRight />
              </Link>
            </>
          )}
          <button
            ref={menuButton}
            className="lp-icon-button lp-menu-toggle"
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="lp-mobile-menu"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>
      <div id="lp-mobile-menu" className="lp-mobile-menu" hidden={!open}>
        <Link to="/#features" onClick={() => setOpen(false)}>
          Features <FiArrowUpRight />
        </Link>
        <Link to="/#analytics" onClick={() => setOpen(false)}>
          Your progress <FiArrowUpRight />
        </Link>
        <Link to="/#how-it-works" onClick={() => setOpen(false)}>
          How it works <FiArrowUpRight />
        </Link>
        {!user && (
          <Link to="/login">
            Log in <FiArrowUpRight />
          </Link>
        )}
      </div>
    </header>
  );
}
export function LandingFooter() {
  const { user } = useAuth();
  return (
    <footer className="lp-footer lp-container">
      <div className="lp-footer-top">
        <div>
          <LandingBrand />
          <p>
            A place for your effort.
            <br />A clearer view of your progress.
          </p>
        </div>
        <nav aria-label="Product links">
          <span>EXPLORE</span>
          <Link to="/#features">Features</Link>
          <Link to="/#analytics">Analytics &amp; reports</Link>
          <Link to="/#how-it-works">How it works</Link>
        </nav>
        <nav aria-label="Account links">
          <span>YOUR WORKSPACE</span>
          {!user && (
            <>
              <Link to="/register">
                Create an account <FiArrowUpRight />
              </Link>
              <Link to="/login">
                Log in <FiArrowUpRight />
              </Link>
            </>
          )}
          <Link to="/#product-preview">Explore the preview</Link>
        </nav>
      </div>
      <div className="lp-footer-bottom">
        <span>© {new Date().getFullYear()} Fitness Tracker</span>
        <span>EVERYDAY EFFORT. LONG-TERM PERSPECTIVE.</span>
        <a
          href="#lp-title"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
