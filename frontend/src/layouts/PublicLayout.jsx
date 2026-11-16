import { Outlet } from 'react-router-dom';
import {
  LandingFooter,
  LandingNav,
} from '../components/landing/LandingChrome.jsx';
import '../styles/pages/landing.css';

function PublicLayout() {
  return (
    <div className="site-frame lp-shell">
      <LandingNav />
      <main className="site-main" id="landing-content" tabIndex={-1}>
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
}

export default PublicLayout;
