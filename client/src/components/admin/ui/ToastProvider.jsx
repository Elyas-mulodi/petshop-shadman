import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: Check, tone: "border-sage/50 text-sage" },
  error: { icon: AlertTriangle, tone: "border-danger/50 text-danger" },
  info: { icon: Info, tone: "border-line text-paper" },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 left-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          <AnimatePresence>
            {toasts.map((toast) => {
              const { icon: Icon, tone } = STYLES[toast.type];
              return (
                <motion.div
                  key={toast.id}
                  layout
                  role={toast.type === "error" ? "alert" : "status"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg ${tone}`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="flex-1 leading-6 text-paper">{toast.message}</p>
                  <button
                    onClick={() => dismiss(toast.id)}
                    aria-label="بستن"
                    className="text-muted hover:text-paper"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast باید داخل ToastProvider استفاده بشه");
  return ctx;
};