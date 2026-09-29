import { forwardRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";

export const StepHeading = ({ title, hint }) => (
  <div className="mb-7">
    <h2 className="font-display text-xl font-bold text-paper">{title}</h2>
    {hint && <p className="mt-1.5 text-sm leading-6 text-muted">{hint}</p>}
  </div>
);

export const Field = forwardRef(({ label, error, trailing, className = "", ...props }, ref) => (
  <label className="mb-4 block">
    <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
    <div className="relative">
      <input
        ref={ref}
        className={`w-full rounded-lg border bg-ink py-2.5 text-sm text-paper transition-colors placeholder:text-muted/60 focus:outline-none ${
          trailing ? "pl-10 pr-3.5" : "px-3.5"
        } ${error ? "border-danger" : "border-line focus:border-bronze"} ${className}`}
        {...props}
      />
      {trailing && <div className="absolute left-3 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
    {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
  </label>
));
Field.displayName = "Field";

export const FormError = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        role="alert"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 overflow-hidden rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger"
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

export const SubmitButton = ({ loading, children }) => (
  <button
    type="submit"
    disabled={loading}
    className="flex w-full items-center justify-center gap-2 rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);