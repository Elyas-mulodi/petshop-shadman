const ActiveSwitch = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
      checked ? "bg-bronze" : "bg-well"
    }`}
  >
    <span
      className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition-all ${
        checked ? "right-[22px]" : "right-0.5"
      }`}
    />
  </button>
);

export default ActiveSwitch;