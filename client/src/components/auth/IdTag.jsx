import { useEffect } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";

const ease = [0.22, 1, 0.36, 1];

const IdTag = ({ stepKey, shake = 0, children }) => {
  const controls = useAnimationControls();

  useEffect(() => {
    if (shake > 0) {
      controls.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
    }
  }, [shake, controls]);

  return (
    <motion.div
      className="w-full max-w-sm origin-top"
      initial={{ rotate: 7, y: -30, opacity: 0 }}
      animate={{ rotate: 0, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 70, damping: 5, mass: 1.2 }}
    >
      <div
        className="relative z-10 mx-auto -mb-5 h-10 w-10 rounded-full border-[3px] border-bronze"
        aria-hidden="true"
      />

      <motion.div animate={controls} style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stepKey}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="relative rounded-3xl border border-bronze bg-card px-7 pb-8 pt-12"
          >
            <span
              className="absolute left-1/2 top-4 h-3 w-3 -translate-x-1/2 rounded-full border border-bronze bg-ink"
              aria-hidden="true"
            />
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default IdTag;