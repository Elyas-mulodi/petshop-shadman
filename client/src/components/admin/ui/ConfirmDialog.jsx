import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import Button from "./Button";
import { useOverlay } from "../../../hooks/useOverlay";

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "تایید",
  cancelLabel = "انصراف",
  tone = "danger", // danger | primary
  loading = false,
  onConfirm,
  onClose,
}) => {
  const titleId = useId();
  const cancelRef = useRef(null);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  useOverlay(open, handleClose);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-line bg-card p-6"
          >
            <h2 id={titleId} className="font-display text-lg font-bold text-paper">
              {title}
            </h2>
            {message && <p className="mt-2 text-sm leading-7 text-muted">{message}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <Button ref={cancelRef} variant="secondary" onClick={handleClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default ConfirmDialog;