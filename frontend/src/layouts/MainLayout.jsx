import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiHome,
  FiActivity,
  FiCoffee,
  FiTrendingUp,
  FiTarget,
  FiBell,
  FiFileText,
  FiSettings,
  FiHelpCircle,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiBarChart2,
  FiSun,
  FiMoon,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLogout } from '../hooks/useLogout';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import notificationService from '../services/notificationService';
import { EASE } from '../components/Transitions';
import '../styles/pages/landing.css';

const NAV_SECTIONS = [
  {
    title: 'Menu',
    items: [
      { to: '/', label: 'Dashboard', icon: <FiHome />, end: true },
      { to: '/workouts', label: 'Workouts', icon: <FiActivity /> },
      { to: '/nutrition', label: 'Nutrition', icon: <FiCoffee /> },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/progress', label: 'Progress', icon: <FiTrendingUp /> },
      { to: '/goals', label: 'Goals', icon: <FiTarget /> },
      { to: '/analytics', label: 'Analytics', icon: <FiBarChart2 /> },
      { to: '/reports', label: 'Reports', icon: <FiFileText /> },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: <FiBell /> },
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { to: '/settings', label: 'Settings', icon: <FiSettings /> },
      { to: '/support', label: 'Support', icon: <FiHelpCircle /> },
    ],
  },
];

const PAGE_TITLES = [
  { match: (p) => p === '/', title: 'Dashboard', crumb: 'Overview' },
  { match: (p) => p === '/workouts', title: 'Workouts', crumb: 'Training log' },
  { match: (p) => p === '/workouts/new', title: 'Log workout', crumb: 'Workouts' },
  { match: (p) => p.startsWith('/workouts/'), title: 'Workout details', crumb: 'Workouts' },
  { match: (p) => p === '/nutrition', title: 'Nutrition', crumb: 'Meals & macros' },
  { match: (p) => p.startsWith('/nutrition/'), title: 'Nutrition entry', crumb: 'Nutrition' },
  { match: (p) => p === '/progress', title: 'Progress', crumb: 'Analytics' },
  { match: (p) => p === '/goals', title: 'Goals', crumb: 'Targets' },
  { match: (p) => p === '/notifications', title: 'Notifications', crumb: 'Activity' },
  { match: (p) => p === '/analytics', title: 'Analytics', crumb: 'Insights' },
  { match: (p) => p === '/reports', title: 'Reports', crumb: 'Exports' },
  { match: (p) => p === '/profile', title: 'Profile', crumb: 'Account' },
  { match: (p) => p === '/settings', title: 'Settings', crumb: 'Account' },
  { match: (p) => p === '/support', title: 'Support', crumb: 'Help' },
];

function usePageTitle(pathname) {
  return useMemo(() => {
    const found = PAGE_TITLES.find((t) => t.match(pathname));
    return found || { title: 'Fitness Tracker', crumb: 'App' };
  }, [pathname]);
}

function SidebarNav({ onNavigate, collapsed = false, mobile = false }) {
  return (
    <nav className={mobile ? 'sidebar-nav mobile' : 'sidebar-nav'} aria-label="Main">
      {NAV_SECTIONS.map((section, i) => (
        <div key={section.title}>
          {i > 0 && !collapsed && <div className="sidebar-sep" />}
          {!collapsed && <div className="sidebar-section-title">{section.title}</div>}
          {collapsed && i > 0 && <div className="sidebar-sep" />}
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function UserBlock({ user, onLogout, compact = false }) {
  return (
    <div className="sidebar-user">
      <Avatar user={user} />
      {!compact && (
        <div className="sidebar-user-meta">
          <strong>{user?.name}</strong>
          <span className="muted">@{user?.username}</span>
        </div>
      )}
      {!compact && (
        <button
          type="button"
          className="icon-btn sidebar-logout"
          aria-label="Log out"
          title="Log out"
          onClick={onLogout}
        >
          <FiLogOut />
        </button>
      )}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="icon-btn topbar-action"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={onToggle}
    >
      {isDark ? <FiMoon /> : <FiSun />}
    </button>
  );
}

function MainLayout() {
  const { user } = useAuth();
  const { logout: handleLogout } = useLogout();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar:collapsed') === '1');
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef(null);
  const closeBtnRef = useRef(null);
  const menuBtnRef = useRef(null);
  const drawerWasOpen = useRef(false);
  const { title, crumb } = usePageTitle(location.pathname);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    drawerWasOpen.current = true;
    closeBtnRef.current?.focus({ preventScroll: true });
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (drawerOpen || !drawerWasOpen.current) return undefined;
    drawerWasOpen.current = false;
    menuBtnRef.current?.focus({ preventScroll: true });
    return undefined;
  }, [drawerOpen]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 961px)');
    const onChange = (event) => {
      if (event.matches) setDrawerOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const refreshUnread = useCallback(async (signal) => {
    if (!user) return;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (signal?.aborted) return;

      try {
        const res = await notificationService.list(
          { limit: 1, unread: 'true' },
          { signal }
        );
        if (signal?.aborted) return;
        setUnread(res.meta?.total || 0);
        return;
      } catch (err) {
        if (signal?.aborted) return;
        const status = err?.response?.status;
        if (attempt === 2 || status === 429 || status === 401) return;
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const controller = new AbortController();
    refreshUnread(controller.signal);
    const onChange = () => refreshUnread(controller.signal);
    window.addEventListener('notifications:changed', onChange);
    const onFocus = () => refreshUnread(controller.signal);
    window.addEventListener('focus', onFocus);
    return () => {
      controller.abort();
      window.removeEventListener('notifications:changed', onChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshUnread, location.pathname, user]);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem('sidebar:collapsed', c ? '0' : '1');
      return !c;
    });
  };

  return (
    <div className="app-frame lp-shell">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="lp-mark" aria-hidden="true">
            F<span />
          </span>
          <span className="sidebar-brand-text">
            Fitness
            <small>Tracker</small>
          </span>
        </div>
        <button type="button" className="sidebar-collapse" onClick={toggleCollapse} aria-label="Toggle sidebar">
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          <span>Collapse</span>
        </button>
        <SidebarNav collapsed={collapsed} />
        <UserBlock user={user} onLogout={handleLogout} compact={collapsed} />
      </aside>

      <div
        className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        aria-hidden={!drawerOpen}
      >
        <div className="mobile-drawer-backdrop" onClick={closeDrawer} aria-hidden="true" />
        <div className="mobile-drawer-panel">
          <div className="mobile-drawer-head">
            <div className="sidebar-brand" style={{ padding: 0 }}>
              <span className="lp-mark" aria-hidden="true">
                F<span />
              </span>
              <span className="sidebar-brand-text">
                Fitness
                <small>Tracker</small>
              </span>
            </div>
            <button
              type="button"
              ref={closeBtnRef}
              className="icon-btn"
              aria-label="Close menu"
              onClick={closeDrawer}
            >
              <FiX />
            </button>
          </div>
          <SidebarNav mobile onNavigate={closeDrawer} />
          <UserBlock user={user} onLogout={handleLogout} />
        </div>
      </div>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              ref={menuBtnRef}
              className="icon-btn menu-btn"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <FiMenu />
            </button>
            <div>
              <p className="topbar-crumb">{crumb}</p>
              <p className="topbar-title">{title}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <NavLink
              to="/notifications"
              className="icon-btn topbar-action"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            >
              <FiBell />
              {unread > 0 && <span className="topbar-badge">{unread > 9 ? '9+' : unread}</span>}
            </NavLink>

            <div className="topbar-user-wrap" ref={menuRef}>
              <button
                type="button"
                className={`topbar-user ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} className="sm" />
                <span className="topbar-user-name">{user?.name}</span>
                <FiChevronDown className="chev" size={14} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="menu"
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: EASE }}
                  >
                    <div className="menu-label">Signed in as @{user?.username}</div>
                    <NavLink to="/profile" className="menu-item" role="menuitem">
                      <FiUser /> Profile
                    </NavLink>
                    <NavLink to="/settings" className="menu-item" role="menuitem">
                      <FiSettings /> Settings
                    </NavLink>
                    <NavLink to="/support" className="menu-item" role="menuitem">
                      <FiHelpCircle /> Support
                    </NavLink>
                    <div className="menu-sep" />
                    <button type="button" className="menu-item danger" role="menuitem" onClick={handleLogout}>
                      <FiLogOut /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="app-content" id="landing-content" tabIndex={-1}>
          <Suspense fallback={<LoadingSpinner label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
