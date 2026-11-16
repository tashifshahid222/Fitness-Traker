import '../styles/pages/notfound.css';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCompass, FiHome } from 'react-icons/fi';
import { EASE } from '../components/Transitions';

function NotFound() {
  return (
    <div className="page nf-page">
      <motion.div
        className="card nf-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            <FiCompass />
          </span>
          <h1 className="nf-code">404</h1>
          <p className="muted">This page took a rest day — it doesn’t exist.</p>
          <Link to="/" className="btn">
            <FiHome /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default NotFound;
