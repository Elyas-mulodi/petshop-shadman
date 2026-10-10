import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export const SelectField = forwardRef(
  ({ label, error, options, placeholder, disabled, ...props }, ref) => (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none rounded-lg border bg-ink py-2.5 pl-10 pr-3.5 text-sm text-paper transition-colors focus:outline-none disabled:opacity-50 ${
            error ? "border-danger" : "border-line focus:border-bronze"
          }`}
          {...props}
        >
          <option value="" className="bg-card text-muted">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="bg-card text-paper">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </label>
  )
);
SelectField.displayName = "SelectField";

export const TextAreaField = forwardRef(({ label, error, ...props }, ref) => (
  <label className="mb-4 block">
    <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
    <textarea
      ref={ref}
      rows={3}
      className={`w-full resize-none rounded-lg border bg-ink px-3.5 py-2.5 text-sm leading-7 text-paper transition-colors placeholder:text-muted/60 focus:outline-none ${
        error ? "border-danger" : "border-line focus:border-bronze"
      }`}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
  </label>
));
TextAreaField.displayName = "TextAreaField";