import { useEffect, useRef } from "react";

const Checkbox = ({ checked, indeterminate = false, onChange, label, className = "" }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      className={`h-4 w-4 cursor-pointer rounded accent-bronze ${className}`}
    />
  );
};

export default Checkbox;