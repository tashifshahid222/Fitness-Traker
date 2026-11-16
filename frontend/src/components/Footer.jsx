import { Link } from "react-router-dom";
import { SiGithub, SiX, SiInstagram, SiFacebook, SiYoutube } from "react-icons/si";
import "./Footer.css";

const SOCIALS = [
  { label: "GitHub", Icon: SiGithub },
  { label: "X", Icon: SiX },
  { label: "Instagram", Icon: SiInstagram },
  { label: "Facebook", Icon: SiFacebook },
  { label: "YouTube", Icon: SiYoutube },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-mark">F</span>
            <span className="footer-name">Fitness Tracker</span>
          </div>
          <p className="footer-tagline">
            Log workouts, meals and weight in one place. See your progress add up.
          </p>
          <div className="footer-socials">
            {SOCIALS.map(({ label, Icon }) => (
              <a key={label} href="#" aria-label={label} title={label} className="footer-social" rel="noreferrer">
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="footer-cta">Register</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Fitness Tracker. All rights reserved.</span>
        <span>Your data stays private.</span>
      </div>
    </footer>
  );
}

export default Footer;
