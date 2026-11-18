import { useId } from "react";
import { motion } from "motion/react";
import foxLogo from "../../../public/assets/foxLogo.png";

const COLORS = {
  orange: "#FF8A00",
  paper: "#F1EDE3",
  ink: "#171817",
  sage: "#829681",
};

const Logo = ({
  className = "",
  compact = false,
  size = 38,
  tagline = "فروشگاه حیوانات خانگی",
}) => {
  const clipId = `fox-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const wordHeight = Math.round(size * 0.4);
  const wordWidth = Math.round((wordHeight * 306) / 46);

  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      role="img"
      aria-label="Foxy Pet"
    >
      <motion.img
        src={foxLogo}
        alt="Foxy Pet Logo"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        draggable={false}
        whileHover={{ rotate: -5, scale: 1.05 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 16,
        }}
      />

      {!compact && (
        <span className="flex flex-col leading-none">
          {/* FOXY PET */}
          <svg
            width={wordWidth}
            height={wordHeight}
            viewBox="-3 -3 306 46"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* FOXY */}
            <g stroke={COLORS.paper}>
              <path d="M0 40V0H22M0 19H18" />
              <circle cx="56" cy="20" r="20" />
              <path d="M90 0L120 40M120 0L90 40" />
              <path d="M134 0L149 22L164 0M149 22V40" />
            </g>

            {/* PET */}
            <g stroke={COLORS.orange}>
              <path d="M194 40V0H208A12 12 0 0 1 208 24H194" />
              <path d="M256 0H234V40H256M234 20H252" />
              <path d="M270 0H300M285 0V40" />
            </g>
          </svg>

          {/* Tagline */}
          {tagline && (
            <span className="mt-2 text-[11px] text-sage">{tagline}</span>
          )}
        </span>
      )}
    </span>
  );
};

export default Logo;
