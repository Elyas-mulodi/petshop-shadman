import { useId } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useOverlay } from "../../../hooks/useOverlay";

const Modal = ({ open, title, description, onClose, children, footer, width = "max-w-lg", dismissible = true }) => {
  const titleId = useId();
  const close = () => dismissible && onClose();

  useOverlay(open, close);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex max-h-[90vh] w-full ${width} flex-col rounded-2xl border border-line bg-card`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div>
                <h2 id={titleId} className="font-display text-lg font-bold text-paper">
                  {title}
                </h2>
                {description && <p className="mt-1 text-xs leading-6 text-muted">{description}</p>}
              </div>
              {dismissible && (
                <button onClick={onClose} aria-label="بستن" className="text-muted hover:text-paper">
                  <X className="h-5 w-5" />
                </button>
              )}
            </header>

            <div className="overflow-y-auto p-5">{children}</div>

            {footer && <footer className="flex justify-end gap-2 border-t border-line p-4">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Modal;