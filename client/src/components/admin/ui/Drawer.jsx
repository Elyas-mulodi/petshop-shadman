import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useOverlay } from "../../../hooks/useOverlay";

const Drawer = ({ open, title, description, onClose, children, footer, width = "max-w-md" }) => {
  useOverlay(open, onClose);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-ink/70 backdrop-blur-sm"
        />
      )}
      {open && (
        <motion.aside
          key="drawer"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed inset-y-0 left-0 z-[75] flex w-full ${width} flex-col border-r border-line bg-card`}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              <h2 className="font-display text-lg font-bold text-paper">{title}</h2>
              {description && <p className="mt-1 text-xs text-muted">{description}</p>}
            </div>
            <button onClick={onClose} aria-label="بستن" className="text-muted hover:text-paper">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {footer && <footer className="border-t border-line p-4">{footer}</footer>}
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Drawer;