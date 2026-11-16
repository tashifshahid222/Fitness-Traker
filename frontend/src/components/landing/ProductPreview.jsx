import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FiArrowUpRight, FiMaximize2, FiX } from 'react-icons/fi';

// These are unmodified screenshots captured from the running app in Brave.
// See public/product/README.md for capture provenance.
export const PRODUCT_SCREENS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    alt: 'The actual Fitness Tracker dashboard with its lime welcome panel, weekly workout chart, weight trend, and sidebar navigation.',
  },
  {
    key: 'workouts',
    label: 'Workouts',
    alt: 'The actual workout tracker showing exercise names, categories, dates, sets, reps, weights, search, and pagination.',
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    alt: 'The actual nutrition tracker showing recorded meals, foods, calories, and protein, carbohydrate, and fat values.',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    alt: 'The actual analytics page showing workout frequency, category distribution, and top exercises from the demo account.',
  },
  {
    key: 'progress',
    label: 'Progress',
    alt: 'The actual progress page with the weight trend, body measurement chart, and progress entry form.',
  },
  {
    key: 'goals',
    label: 'Goals',
    alt: 'The actual goals page showing active goals, progress rings, targets, and deadlines.',
  },
  {
    key: 'reports',
    label: 'Reports',
    alt: 'The actual reports page showing workout summaries, recorded exercises, and CSV and PDF export controls.',
  },
];

const ScreenshotContext = createContext(null);export function ScreenshotProvider({ children }) {
  const [screen, setScreen] = useState(null);
  const dialog = useRef(null);
  useEffect(() => {
    if (!screen) return;
    const previousOverflow = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [screen]);
  return (
    <ScreenshotContext.Provider value={setScreen}>
      {children}
      <dialog
        ref={dialog}
        className="lp-screenshot-dialog"
        aria-labelledby="lp-screenshot-title"
        onCancel={() => setScreen(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setScreen(null);
        }}
      >
        {screen && (
          <>
            <div className="lp-screenshot-dialog-head">
              <div>
                <h2 id="lp-screenshot-title">{screen.label}</h2>
                <p>Actual application screenshot · Demo account data</p>
              </div>
              <button
                type="button"
                className="lp-icon-button"
                aria-label="Close screenshot"
                onClick={() => setScreen(null)}
              >
                <FiX />
              </button>
            </div>
            <div
              className="lp-screenshot-dialog-body"
              tabIndex={0}
              aria-label="Screenshot; scroll horizontally on small screens to inspect details"
            >
              <img
                src={`/product/${screen.key}.jpg`}
                alt={screen.alt}
                width={screen.width || 1844}
                height={screen.height || 906}
                className={screen.mobile ? 'lp-full-mobile-capture' : undefined}
              />
            </div>
            <p className="lp-screenshot-dialog-note">
              {screen.description ||
                'Captured directly from the running Fitness Tracker app in Brave.'}{' '}
              <span>
                Scroll to inspect the full screen. Press Esc to close.
              </span>
              <a
                href={`/product/${screen.key}.jpg`}
                target="_blank"
                rel="noreferrer"
              >
                Open full-resolution image <FiArrowUpRight aria-hidden="true" />
              </a>
            </p>
          </>
        )}
      </dialog>
    </ScreenshotContext.Provider>
  );
}

export function ProductScreenshot({
  screenKey,
  label,
  alt,
  crop = false,
  priority = false,
  mobile = false,
  className = '',
}) {
  const openScreenshot = useContext(ScreenshotContext);
  const known = PRODUCT_SCREENS.find((screen) => screen.key === screenKey);
  const screen = {
    key: screenKey,
    label: label || known?.label,
    alt: alt || known?.alt,
  };
  return (
    <button
      type="button"
      className={`lp-product-capture ${crop ? 'lp-capture-crop' : ''} ${className}`}
      onClick={(event) => {
        const showingMobile =
          mobile &&
          event.currentTarget
            .querySelector('img')
            ?.currentSrc.endsWith('/dashboard-mobile.jpg');
        openScreenshot(
          showingMobile
            ? {
                ...screen,
                key: 'dashboard-mobile',
                mobile: true,
                width: 380,
                height: 822,
              }
            : screen,
        );
      }}
      aria-label={`Enlarge ${screen.label} screenshot`}
    >
      <picture>
        {mobile && (
          <source
            media="(max-width: 640px)"
            srcSet="/product/dashboard-mobile.jpg"
            width="380"
            height="822"
          />
        )}
        <img
          src={`/product/${screen.key}.jpg`}
          width="1844"
          height="906"
          alt={screen.alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      </picture>
      <span className="lp-capture-enlarge">
        <FiMaximize2 aria-hidden="true" />
        <span>Enlarge</span>
      </span>
    </button>
  );
}

export default function ProductPreview() {
  const [active, setActive] = useState('dashboard');
  const screen = PRODUCT_SCREENS.find((item) => item.key === active);
  return (
    <figure
      className="lp-product-gallery"
      id="product-preview"
      aria-label="Real Fitness Tracker application screenshots"
    >
      <div
        className="lp-gallery-controls"
        role="group"
        aria-label="Choose an application screenshot"
      >
        {PRODUCT_SCREENS.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => setActive(item.key)}
            aria-pressed={active === item.key}
            className={active === item.key ? 'is-active' : ''}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ProductScreenshot
        screenKey={active}
        priority={active === 'dashboard'}
        mobile={active === 'dashboard'}
      />
      <figcaption>
        <span>
          <span className="lp-live-dot" /> {screen.label}{' '}
          <span className="lp-caption-divider">/</span> The real application
        </span>
        <span>
          Demo account data <span aria-hidden="true">·</span> Click to enlarge{' '}
          <FiArrowUpRight aria-hidden="true" />
        </span>
      </figcaption>
    </figure>
  );
}

export function AnalyticsScreens() {
  const [active, setActive] = useState('analytics');
  return (
    <figure className="lp-analytics-screens">
      <div className="lp-analytics-screen-head">
        <div role="group" aria-label="Choose an analytics screenshot">
          {[
            ['analytics', 'Workout analytics'],
            ['progress', 'Weight & measurements'],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={active === key}
              onClick={() => setActive(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span>ACTUAL APP CAPTURE</span>
      </div>
      <ProductScreenshot screenKey={active} crop />
      <figcaption>
        {active === 'analytics'
          ? 'Workout frequency, category breakdowns, and top exercises.'
          : 'Weight trends and body measurements over time.'}{' '}
        <span>Captured from the demo account.</span>
      </figcaption>
    </figure>
  );
}
