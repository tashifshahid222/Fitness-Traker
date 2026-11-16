import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

const ICONS = {
  success: <FiCheckCircle />,
  error: <FiXCircle />,
  warning: <FiAlertTriangle />,
  info: <FiInfo />,
};

const DURATION = 4200;
let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  // Mirror of `toasts` so `push` can detect an already-visible duplicate
  // synchronously, even before React re-renders.
  const toastsRef = useRef([]);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const dismiss = useCallback((id) => {
    const next = toastsRef.current.filter((t) => t.id !== id);
    toastsRef.current = next;
    setToasts(next);
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (type, title, message) => {
      const normalized = message || '';

      // Errors/warnings/info should only appear once: if the same toast is
      // already on screen, refresh its lifetime instead of stacking a copy.
      if (type !== 'success') {
        const existing = toastsRef.current.find(
          (t) => t.type === type && t.title === title && (t.message || '') === normalized
        );
        if (existing) {
          clearTimeout(timers.current[existing.id]);
          timers.current[existing.id] = setTimeout(() => dismiss(existing.id), DURATION);
          return existing.id;
        }
      }

      const id = ++seq;
      const base = type === 'success' ? toastsRef.current.filter((t) => t.type !== 'success') : toastsRef.current;

      // Drop any toasts pushed out by the 4-item cap and clear their timers.
      if (base.length > 3) {
        base.slice(0, base.length - 3).forEach((t) => {
          clearTimeout(timers.current[t.id]);
          delete timers.current[t.id];
        });
      }

      const next = [...base.slice(-3), { id, type, title, message }];
      toastsRef.current = next;
      setToasts(next);
      timers.current[id] = setTimeout(() => dismiss(id), DURATION);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      warning: (title, message) => push('warning', title, message),
      info: (title, message) => push('info', title, message),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast ${t.type}`}
              layout
              initial={{ opacity: 0, x: 64, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
              <div className="toast-body">
                <p className="toast-title">{t.title}</p>
                {t.message && <p className="toast-msg">{t.message}</p>}
              </div>
              <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
                <FiX />
              </button>
              <span className="toast-progress" style={{ animationDuration: `${DURATION}ms` }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
