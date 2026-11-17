import { motion } from "motion/react";

const Logo = ({ className = "", compact = false }) => (
  <span className={`inline-flex items-center gap-3 ${className}`}>
    <motion.svg
      width="38"
      height="38"
      viewBox="0 0 40 40"
      fill="none"
      className="text-bronze"
      aria-hidden="true"
      whileHover={{ rotate: -8, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 300, damping: 14 }}
    >
      <circle cx="20" cy="20" r="18.5" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="currentColor"
        className="font-display"
      >
        F
      </text>
    </motion.svg>

    {!compact && (
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold text-bronze">Foxy Pet Shop</span>
        <span className="mt-1.5 text-[11px] tracking-[0.2em] text-muted">ّFoxy Pet</span>
      </span>
    )}
  </span>
);

export default Logo;