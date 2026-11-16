import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FiActivity,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCheck,
  FiCoffee,
  FiFileText,
  FiTarget,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import ProductPreview, {
  AnalyticsScreens,
  ProductScreenshot,
  ScreenshotProvider,
} from '../components/landing/ProductPreview';
import '../styles/pages/landing.css';

function Reveal({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
function StartLink({ className = '', children = 'Get Started Free' }) {
  const { user } = useAuth();
  return (
    <Link className={`lp-button ${className}`} to={user ? '/' : '/register'}>
      {user ? 'Go to dashboard' : children}
      <FiArrowUpRight aria-hidden="true" />
    </Link>
  );
}
export default function Landing() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      return;
    }
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash]);
  return (
    <ScreenshotProvider>
      <div className="lp">
        <section className="lp-hero lp-container" aria-labelledby="lp-title">
          <Reveal>
            <div className="lp-eyebrow">
              <span className="lp-live-dot" /> BUILT FOR YOUR EVERYDAY BETTER
            </div>
          </Reveal>
          <div className="lp-hero-grid">
            <Reveal>
              <h1 id="lp-title">
                Your effort.
                <br />
                <span>In perspective.</span>
              </h1>
            </Reveal>
            <Reveal className="lp-hero-copy" delay={0.1}>
              <p>
                Every workout. Every meal. Every small win.
                <br className="lp-desktop-break" /> Bring it all together, and
                see how far you can go.
              </p>
              <div className="lp-hero-actions">
                <StartLink />
                <a href="#features" className="lp-text-link">
                  Explore Features <FiArrowRight />
                </a>
              </div>
              <span className="lp-hero-note">
                <FiCheck /> Free to get started. Made to keep going.
              </span>
            </Reveal>
          </div>
          <Reveal className="lp-dashboard-stage" delay={0.18}>
            <div className="lp-stage-header">
              <span>
                <span className="lp-live-dot" /> THE BIG PICTURE. ONE WORKSPACE.
              </span>
              <span>TRACK / UNDERSTAND / PROGRESS</span>
            </div>
            <ProductPreview />
            <div className="lp-stage-caption">
              <span>A preview of your next chapter.</span>
              <span>Screenshots captured in Brave · Demo account</span>
            </div>
          </Reveal>
        </section>
        <div
          className="lp-capabilities lp-container"
          aria-label="Product capabilities"
        >
          {[
            ['TRAIN', 'Workout logging'],
            ['FUEL', 'Nutrition tracking'],
            ['REFLECT', 'Progress analytics'],
            ['FOCUS', 'Personal goals'],
            ['TAKE IT WITH YOU', 'CSV & PDF reports'],
          ].map(([label, text]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{text}</strong>
            </div>
          ))}
        </div>
        <section
          className="lp-features lp-container"
          id="features"
          aria-labelledby="lp-features-title"
        >
          <Reveal className="lp-section-heading">
            <div>
              <p className="lp-eyebrow">01 / A MORE CONNECTED ROUTINE</p>
              <h2 id="lp-features-title">
                Less scattered.
                <br />
                More in sync.
              </h2>
            </div>
            <p>
              Your training doesn’t happen in isolation.
              <br />
              Your tracking shouldn’t either.
            </p>
          </Reveal>
          <Reveal className="lp-feature-wide">
            <div className="lp-feature-copy">
              <span className="lp-feature-kicker">
                <FiActivity /> WORKOUT TRACKING
              </span>
              <h3>
                Put the work in.
                <br />
                Keep the details.
              </h3>
              <p>
                From the first rep to the last set. Log your exercises, weights,
                sets, reps, and notes, with categories that keep every session
                organized.
              </p>
              <a href="#product-preview" className="lp-text-link">
                Explore the workout log <FiArrowUpRight />
              </a>
              <span className="lp-feature-foot">
                YOUR ROUTINE. YOUR RECORD.
              </span>
            </div>
            <figure className="lp-real-feature lp-workout-capture">
              <ProductScreenshot
                screenKey="workout-detail"
                label="Workout details"
                alt="Actual workout detail screen for the demo account’s deadlift, showing its recorded sets, reps, weight, date, category, and notes."
                crop
              />
              <figcaption>
                Every detail, as it appears in your workspace.{' '}
                <span>Actual app screenshot</span>
              </figcaption>
            </figure>
          </Reveal>
          <div className="lp-feature-pair">
            <Reveal className="lp-nutrition-feature">
              <span className="lp-feature-kicker">
                <FiCoffee /> NUTRITION TRACKING
              </span>
              <h3>Fuel with intention.</h3>
              <p>
                Log your meals. See your calories, protein, carbs, and fats come
                together throughout the day.
              </p>
              <figure className="lp-real-feature">
                <ProductScreenshot
                  screenKey="nutrition-detail"
                  label="Meal details"
                  alt="Actual meal detail screen showing the demo account’s food items, calories, protein, carbs, fats, and quantity."
                  crop
                />
                <figcaption>
                  Calories and macros, straight from your meal log.
                </figcaption>
              </figure>
            </Reveal>
            <Reveal className="lp-goal-feature" delay={0.08}>
              <span className="lp-feature-kicker">
                <FiTarget /> GOAL MANAGEMENT
              </span>
              <h3>
                A little direction.
                <br />A lot of possibility.
              </h3>
              <p>
                Set a target and a deadline. Track your progress, get reminders,
                and see completed goals in your archive.
              </p>
              <figure className="lp-real-feature">
                <ProductScreenshot screenKey="goals" crop />
                <figcaption>
                  Your targets, deadlines, and progress in one view.
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>
        <section
          className="lp-analytics-section"
          id="analytics"
          aria-labelledby="lp-analytics-title"
        >
          <div className="lp-container lp-analytics-grid">
            <Reveal className="lp-analytics-copy">
              <p className="lp-eyebrow">02 / SEE WHAT ADDS UP</p>
              <h2 id="lp-analytics-title">
                Small steps.
                <br />A clearer picture.
              </h2>
              <p>
                Progress has a shape. See yours in workout frequency, nutrition
                breakdowns, weight trends, and body measurements.
              </p>
              <div className="lp-analytics-benefit">
                <FiBarChart2 />
                <span>
                  Understand the patterns
                  <br />
                  <small>Interactive charts for what you record.</small>
                </span>
              </div>
              <div className="lp-analytics-benefit">
                <FiFileText />
                <span>
                  Keep the bigger picture
                  <br />
                  <small>Export your reports as CSV or PDF.</small>
                </span>
              </div>
            </Reveal>
            <Reveal className="lp-real-analytics" delay={0.1}>
              <AnalyticsScreens />
            </Reveal>
          </div>
        </section>
        <section
          className="lp-report-showcase lp-container"
          aria-labelledby="lp-reports-title"
        >
          <Reveal className="lp-report-copy">
            <p className="lp-eyebrow">YOUR RECORD. READY TO TAKE WITH YOU.</p>
            <h2 id="lp-reports-title">
              Progress worth
              <br />
              looking back on.
            </h2>
            <p>
              Review workout, nutrition, and progress summaries. Export your
              recorded data as CSV or PDF, right from the reports page.
            </p>
            <a href="#product-preview" className="lp-text-link">
              See the full workspace <FiArrowUpRight />
            </a>
          </Reveal>
          <Reveal className="lp-report-capture" delay={0.08}>
            <figure className="lp-real-feature">
              <ProductScreenshot screenKey="reports" crop />
              <figcaption>
                Real records. The app’s existing export controls.{' '}
                <span>Demo account data</span>
              </figcaption>
            </figure>
          </Reveal>
        </section>
        <section
          className="lp-how lp-container"
          id="how-it-works"
          aria-labelledby="lp-how-title"
        >
          <Reveal className="lp-section-heading">
            <div>
              <p className="lp-eyebrow">03 / KEEP IT SIMPLE. KEEP GOING.</p>
              <h2 id="lp-how-title">
                Your next chapter
                <br />
                starts with a first step.
              </h2>
            </div>
            <StartLink className="lp-button-outline" />
          </Reveal>
          <div className="lp-steps">
            {[
              [
                '01',
                'Make it yours.',
                'Create your free account and make space for your routine.',
              ],
              [
                '02',
                'Show up. Log it.',
                'Record your workouts, meals, and progress as you go.',
              ],
              [
                '03',
                'Connect the dots.',
                'Look back at your activity and understand your patterns.',
              ],
              [
                '04',
                'Keep moving forward.',
                'Set goals, follow your progress, and build on your effort.',
              ],
            ].map(([number, title, text], i) => (
              <Reveal key={number} delay={i * 0.05}>
                <div className="lp-step-number">
                  {number}
                  <FiArrowUpRight />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="lp-final-wrap lp-container">
          <Reveal className="lp-final">
            <div className="lp-final-top">
              <span>FITNESS IS A PRACTICE.</span>
              <FiActivity />
            </div>
            <h2>
              Make progress.
              <br />
              <span>Make it yours.</span>
            </h2>
            <div className="lp-final-bottom">
              <p>
                You bring the effort.
                <br />
                We’ll help you see the bigger picture.
              </p>
              <StartLink />
            </div>
            <div className="lp-final-lines" aria-hidden="true" />
          </Reveal>
        </section>
      </div>
    </ScreenshotProvider>
  );
}
