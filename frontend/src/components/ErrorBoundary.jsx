import { Component } from 'react';
import { useNavigate } from 'react-router-dom';

const RELOAD_STATE_KEY = 'fitnessTrackerReloads';
const MAX_RECOVERY_RELOADS = 2;
const RECOVERY_CHECK_INTERVAL = 5000;
const CONNECTION_TIMEOUT = 4000;
const HEALTHY_RESET_DELAY = 10000;

const CONNECTION_MESSAGE =
  'Please check your internet connection. This page will refresh automatically when you are back online.';

const isChunkLoadError = (error) => {
  const message = String(error?.message || '');
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk .* failed|unable to preload css|failed to load module script|networkerror|load failed|failed to fetch/i.test(
    message
  );
};

const emptyReloads = () => ({ recovery: 0 });

const readReloads = () => {
  try {
    return { ...emptyReloads(), ...JSON.parse(sessionStorage.getItem(RELOAD_STATE_KEY) || '{}') };
  } catch {
    return emptyReloads();
  }
};

const writeReloads = (value) => {
  try {
    sessionStorage.setItem(RELOAD_STATE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage may be unavailable (private mode); reloading is still safe.
  }
};

const clearReloads = () => {
  try {
    sessionStorage.removeItem(RELOAD_STATE_KEY);
  } catch {
    // Ignore storage errors.
  }
};

// SPA navigation to home — no full page reload. Resets the boundary first so the
// home route renders instead of the error UI.
const HomeButton = ({ onReset }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => {
        onReset();
        navigate('/');
      }}
    >
      Go home
    </button>
  );
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, offline: false, isConnectionError: false };
    this.reloading = false;
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      isConnectionError: isChunkLoadError(error),
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // If the app stays healthy, forget old reload attempts so future deploys
    // can auto-recover again.
    this.healthyTimer = window.setTimeout(clearReloads, HEALTHY_RESET_DELAY);
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) return;

    window.clearTimeout(this.healthyTimer);
    this.startRecoveryWatch();
  }

  componentWillUnmount() {
    window.clearTimeout(this.healthyTimer);
    this.stopRecoveryWatch();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  startRecoveryWatch = () => {
    if (this.watchTimer) return;
    this.checkConnection();
    this.watchTimer = window.setInterval(this.checkConnection, RECOVERY_CHECK_INTERVAL);
  };

  stopRecoveryWatch = () => {
    if (!this.watchTimer) return;
    window.clearInterval(this.watchTimer);
    this.watchTimer = null;
  };

  checkConnection = async () => {
    if (!this.state.hasError || this.reloading) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

    try {
      // A real network request (no cache) — navigator.onLine is not reliable.
      await fetch(`/index.html?ping=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!this.state.hasError || this.reloading) return;

      const reloads = readReloads();
      if (reloads.recovery >= MAX_RECOVERY_RELOADS) {
        this.stopRecoveryWatch();
        return;
      }

      writeReloads({ ...reloads, recovery: reloads.recovery + 1 });
      this.reloading = true;
      window.location.reload();
    } catch {
      // Still offline — keep waiting and try again shortly.
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  handleOnline = () => {
    this.setState({ offline: false });
    if (this.state.hasError) this.checkConnection();
  };

  handleOffline = () => {
    this.setState({ offline: true });
  };

  handleReload = () => {
    clearReloads();
    window.location.reload();
  };

  handleGoHome = () => {
    this.stopRecoveryWatch();
    this.setState({ hasError: false, offline: false, isConnectionError: false });
  };

  render() {
    if (this.state.hasError) {
      const showConnectionHint = this.state.offline || this.state.isConnectionError;

      return (
        <div className="empty-state error-state" style={{ padding: '5rem 1rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Something went wrong</h1>
          <p className="muted">
            {showConnectionHint ? CONNECTION_MESSAGE : 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={this.handleReload}>
              Try again
            </button>
            <HomeButton onReset={this.handleGoHome} />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
