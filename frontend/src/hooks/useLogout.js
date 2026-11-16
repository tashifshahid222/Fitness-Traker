import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';
import { isNetworkError } from '../services/api';

const CONNECTION_TITLE = 'Connection Error';
const CONNECTION_MESSAGE =
  'Could not log out safely. Please check your internet connection and try again.';

/**
 * Custom logout handler.
 *
 * A logout must never strand the user: if the server cannot confirm session
 * revocation because the network is down (offline, timeout, DNS/CORS failure)
 * we keep the session intact, stay on the current page, and surface a clear
 * toast so the user can retry. We only navigate away once revocation succeeds
 * (or the session was already invalid server-side).
 */
export function useLogout() {
  const { logout, logoutAll } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const run = useCallback(
    async (revoke) => {
      // Fast path: the browser already knows we have no connection, so don't
      // even attempt the request.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        toast.error(CONNECTION_TITLE, CONNECTION_MESSAGE);
        return false;
      }

      try {
        await revoke();
      } catch (error) {
        if (isNetworkError(error)) {
          toast.error(CONNECTION_TITLE, CONNECTION_MESSAGE);
          return false;
        }
        toast.error('Logout incomplete', 'The server could not confirm session revocation. Please try again.');
        return false;
      }

      // Local auth is already cleared by the context; leave the page only now.
      navigate('/login', { replace: true });
      return true;
    },
    [navigate, toast]
  );

  const handleLogout = useCallback(() => run(logout), [run, logout]);
  const handleLogoutAll = useCallback(() => run(logoutAll), [run, logoutAll]);

  return { logout: handleLogout, logoutAll: handleLogoutAll };
}

export default useLogout;
