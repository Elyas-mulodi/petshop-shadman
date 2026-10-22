import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";

export const Card = ({ icon: Icon, title, hint, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-line bg-card p-5 md:p-6 ${className}`}
  >
    {title && (
      <header className="mb-6 flex items-start gap-3">
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-well text-bronze">
            <Icon className="h-5 w-5" strokeWidth={1.6} />
          </span>
        )}
        <div>
          <h2 className="font-display text-base font-bold text-paper">
            {title}
          </h2>
          {hint && <p className="mt-1 text-xs leading-6 text-muted">{hint}</p>}
        </div>
      </header>
    )}
    {children}
  </section>
);

export const FormSuccess = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        role="status"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 flex items-center gap-2 overflow-hidden rounded-md border border-sage/40 bg-sage/10 px-3 py-2 text-xs text-sage"
      >
        <Check className="h-4 w-4 shrink-0" />
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

export const PrimaryButton = ({ loading, disabled, children }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="flex w-full items-center justify-center gap-2 rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {children}
  </button>
);
