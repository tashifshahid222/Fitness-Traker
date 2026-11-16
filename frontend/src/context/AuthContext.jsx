import { createContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AUTH_EXPIRED_EVENT, setAccessToken } from '../services/api';

export const AuthContext = createContext(null);
const AUTH_SESSION_KEY = 'fitnessTrackerAuthenticated';

const clearSessionHint = () => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onExpired = () => {
      setAccessToken(null);
      setUser(null);
      clearSessionHint();
      navigate('/login', { replace: true });
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    localStorage.removeItem('token');

    authService
      .refresh({ suppressAuthExpiredEvent: true })
      .then((token) => {
        if (!token) {
          clearSessionHint();
          return null;
        }
        return authService.getMe();
      })
      .then((res) => {
        if (!cancelled && res) {
          sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
          setUser(res.data.user);
        }
      })
      .catch(() => {
        setAccessToken(null);
        clearSessionHint();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    setAccessToken(res.data.accessToken);
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await authService.register(payload);
    return res.data.user;
  };

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    clearSessionHint();
  }, []);

  // Only clears local auth once the server has confirmed revocation (or the
  // session was already invalid). Network failures are rethrown so callers can
  // keep the user on the page instead of silently dropping their session.
  const revokeSession = useCallback(async (request) => {
    try {
      await request();
    } catch (error) {
      if (error.response?.status !== 401) throw error;
    }
    clearAuth();
  }, [clearAuth]);

  const logout = useCallback(() => revokeSession(() => authService.logout()), [revokeSession]);
  const logoutAll = useCallback(() => revokeSession(() => authService.logoutAll()), [revokeSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, logoutAll, clearAuth, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
