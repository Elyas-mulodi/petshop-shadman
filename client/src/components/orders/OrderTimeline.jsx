import { Check } from "lucide-react";
import { formatDate } from "../../utils/formatDate";

const STEPS = [
  { id: "created", label: "ثبت سفارش" },
  { id: "paid", label: "پرداخت" },
  { id: "processing", label: "آماده‌سازی" },
  { id: "shipped", label: "ارسال" },
  { id: "delivered", label: "تحویل" },
];

const DONE_COUNT = {
  pending_payment: 1,
  paid: 2,
  processing: 3,
  shipped: 4,
  delivered: 5,
};

const OrderTimeline = ({ order }) => {
  const done = DONE_COUNT[order.status] ?? 1;
  const dates = { created: order.createdAt, paid: order.payment?.paidAt };

  return (
    <ol className="grid grid-cols-5">
      {STEPS.map((step, i) => {
        const isDone = i < done;
        const isCurrent = i === done;

        return (
          <li
            key={step.id}
            className="relative flex flex-col items-center text-center"
          >
            {/* خط اتصال به مرحله‌ی بعد */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-3.5 h-px w-full ${
                  i + 1 <= done ? "bg-bronze" : "bg-line"
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border ${
                isDone
                  ? "border-bronze bg-bronze text-ink"
                  : isCurrent
                    ? "border-bronze bg-ink"
                    : "border-line bg-ink"
              }`}
            >
              {isDone ? (
                <Check className="h-4 w-4" strokeWidth={2.4} />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isCurrent ? "bg-bronze" : "bg-line"}`}
                />
              )}
            </span>

            <span
              className={`mt-2 text-[11px] md:text-xs ${
                isDone || isCurrent ? "text-paper" : "text-muted"
              }`}
            >
              {step.label}
            </span>

            {isDone && dates[step.id] && (
              <span className="mt-0.5 text-[10px] text-muted md:text-[11px]">
                {formatDate(dates[step.id])}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
