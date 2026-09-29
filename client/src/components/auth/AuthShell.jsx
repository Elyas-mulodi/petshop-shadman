import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "motion/react";
import Logo from "../common/Logo";

const ease = [0.22, 1, 0.36, 1];

const AuthShell = ({ title, subtitle, stepKey, progress, children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-6xl grid-cols-1 lg:grid-cols-2">
      {/* نیمه برند — ثابت، بدون حرکت */}
      <div className="hidden flex-col justify-between border-l border-line bg-card px-14 py-16 lg:flex">
        <Logo />

        <div>
          <h1 className="max-w-sm font-display text-4xl font-bold leading-[1.3] text-paper">
            {title}
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted">{subtitle}</p>
        </div>

        <p className="text-xs text-muted">© {new Date().getFullYear()} پت شاپ شادمان</p>
      </div>

      {/* نیمه فرم */}
      <div className="flex items-center justify-center px-4 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          {progress !== undefined && (
            <div className="mb-8 h-px w-full bg-line">
              <motion.div
                className="h-full origin-right bg-bronze"
                initial={false}
                animate={{ scaleX: progress }}
                transition={{ duration: 0.4, ease }}
              />
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;