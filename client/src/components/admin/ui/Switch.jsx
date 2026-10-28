const Switch = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? "border-bronze bg-bronze/80" : "border-line bg-well"
    }`}
  >
    <span
      className={`absolute right-[2px] top-[2px] h-[18px] w-[18px] rounded-full bg-paper transition-transform ${
        checked ? "-translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export default Switch;