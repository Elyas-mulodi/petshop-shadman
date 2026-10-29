import { forwardRef } from "react";

const Input = forwardRef(({ error, className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-lg border bg-ink px-3 py-2 text-sm text-paper transition-colors placeholder:text-muted/60 focus:outline-none ${
      error ? "border-danger" : "border-line focus:border-bronze"
    } ${className}`}
    {...props}
  />
));
Input.displayName = "Input";

export default Input;
