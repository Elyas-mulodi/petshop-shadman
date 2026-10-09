import { motion } from "motion/react";
import { formatToman } from "../../utils/price";

const FreeShippingBar = ({ summary }) => {
  if (!summary.threshold || summary.shipping === null) return null;

  const reached = summary.shipping === 0;
  const progress = Math.min(100, (summary.subtotal / summary.threshold) * 100);

  return (
    <div className="mb-5 rounded-xl border border-line bg-card p-4">
      <p className="mb-2.5 text-xs text-muted">
        {reached
          ? "ارسال سفارش شما رایگان است"
          : `${formatToman(summary.freeShippingRemaining)} دیگر خرید کنید تا ارسال رایگان شود`}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-well">
        <motion.div
          className="h-full rounded-full bg-bronze"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
};

export default FreeShippingBar;