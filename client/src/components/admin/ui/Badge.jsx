const TONES = {
  neutral: "border-line bg-well text-muted",
  success: "border-sage/50 bg-sage/10 text-sage",
  warning: "border-bronze/50 bg-bronze/10 text-bronze",
  danger: "border-danger/40 bg-danger/10 text-danger",
};

const Badge = ({ tone = "neutral", children }) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TONES[tone]}`}
  >
    {children}
  </span>
);

export default Badge;