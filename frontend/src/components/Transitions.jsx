import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

export function PageTransition({ children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, delay = 0, y = 16, className, as = 'div', hover = false }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      whileHover={hover ? { y: -5, transition: { duration: 0.2, ease: EASE } } : undefined}
    >
      {children}
    </Comp>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export function Stagger({ children, className, as = 'div' }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp className={className} variants={staggerContainer} initial="hidden" animate="show">
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = 'div', hover = false }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      variants={staggerItem}
      whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: EASE } } : undefined}
    >
      {children}
    </Comp>
  );
}

export { EASE };
