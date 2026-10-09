import { useRef } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Trash2 } from "lucide-react";

const REVEAL = 84;

const SwipeRow = ({ onDelete, children }) => {
  const controls = useAnimationControls();
  const openRef = useRef(false);

  const snap = (open) => {
    openRef.current = open;
    controls.start({
      x: open ? -REVEAL : 0,
      transition: { type: "spring", stiffness: 420, damping: 38 },
    });
  };

  const handleDragEnd = (_, info) => {
    const base = openRef.current ? -REVEAL : 0;
    let open = base + info.offset.x < -REVEAL / 2;
    if (info.velocity.x < -500) open = true;
    if (info.velocity.x > 500) open = false;
    snap(open);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-line">
      <button
        onClick={onDelete}
        aria-label="حذف از سبد"
        className="absolute inset-y-0 right-0 flex w-[84px] flex-col items-center justify-center gap-1 bg-danger text-ink"
      >
        <Trash2 className="h-5 w-5" />
        <span className="text-[11px] font-medium">حذف</span>
      </button>

      <motion.div
        drag="x"
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={0.08}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeRow;