import { useEffect, useRef } from "react";

let lockCount = 0;
let previousOverflow = "";

const lockScroll = () => {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
};

const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = previousOverflow;
};

export const useOverlay = (open, onClose) => {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement;
    lockScroll();

    const onKeyDown = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockScroll();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [open]);
};