import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const THEME_KEY = 'theme';
const PREFERENCE_KEY = 'theme:preference';
const CUSTOM_KEY = 'theme:custom';
const PREFERENCES = ['light', 'dark', 'system'];

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable — the theme still applies */
  }
};

const systemTheme = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (preference) => (preference === 'system' ? systemTheme() : preference);

const readPreference = () => {
  const stored = readStorage(PREFERENCE_KEY);
  if (PREFERENCES.includes(stored)) return stored;
  const resolved = readStorage(THEME_KEY);
  if (resolved === 'light' || resolved === 'dark') {
    /* a theme was already picked on this device — keep it */
    writeStorage(PREFERENCE_KEY, resolved);
    writeStorage(CUSTOM_KEY, '1');
    return resolved;
  }
  return 'system';
};

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [preference, setPreferenceState] = useState(readPreference);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  const applyTheme = useCallback((value) => {
    const resolved = resolveTheme(value);
    document.documentElement.dataset.theme = resolved;
    writeStorage(THEME_KEY, resolved);
    setTheme(resolved);
  }, []);

  const setPreference = useCallback((value) => {
    if (!PREFERENCES.includes(value)) return;
    writeStorage(PREFERENCE_KEY, value);
    writeStorage(CUSTOM_KEY, '1');
    setPreferenceState(value);
  }, []);

  const syncPreference = useCallback((value) => {
    if (!PREFERENCES.includes(value)) return;
    writeStorage(PREFERENCE_KEY, value);
    setPreferenceState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setPreference]);

  useEffect(() => {
    applyTheme(preference);
  }, [preference, applyTheme]);

  useEffect(() => {
    if (preference !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [preference, applyTheme]);

  const serverPreference = user?.preferences?.theme;
  useEffect(() => {
    if (!PREFERENCES.includes(serverPreference)) return;
    if (readStorage(CUSTOM_KEY)) return;
    syncPreference(serverPreference);
  }, [serverPreference, syncPreference]);

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggleTheme }),
    [theme, preference, setPreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
