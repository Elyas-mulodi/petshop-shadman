import { Clock } from "lucide-react";
import { Card } from "../../profile/ProfileParts";
import { formatDateTime } from "../../../utils/formatDate";

const LABELS = {
  pending_payment: "سفارش ثبت شد",
  paid: "پرداخت موفق",
  processing: "شروع آماده‌سازی",
  shipped: "ارسال شد",
  delivered: "تحویل داده شد",
  cancelled: "سفارش لغو شد",
  returned: "مرجوع شد",
  expired: "مهلت پرداخت تمام شد",
};

const OrderHistory = ({ order }) => {
  // سفارش‌های قدیمی ممکنه تاریخچه نداشته باشن؛ از زمان ثبت و پرداخت یه تاریخچه‌ی ساده می‌سازیم
  const entries =
    order.statusHistory?.length > 0
      ? order.statusHistory
      : [
          { status: "pending_payment", at: order.createdAt },
          ...(order.payment?.paidAt ? [{ status: "paid", at: order.payment.paidAt }] : []),
        ];

  return (
    <Card icon={Clock} title="تاریخچه‌ی سفارش">
      <ol className="relative space-y-5 pr-1">
        <span aria-hidden className="absolute bottom-2 right-[7px] top-2 w-px bg-line" />
        {entries.map((entry, i) => {
          const last = i === entries.length - 1;
          const actor = entry.by ? entry.by.name || entry.by.phone : "سیستم";

          return (
            <li key={`${entry.status}-${entry.at}-${i}`} className="relative flex items-start gap-4">
              <span
                className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                  last ? "border-bronze bg-bronze" : "border-line bg-card"
                }`}
              />
              <div>
                <p className={`text-sm ${last ? "font-medium text-paper" : "text-paper"}`}>
                  {LABELS[entry.status] ?? entry.status}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDateTime(entry.at)}
                  {entry.by !== undefined && <> ، {actor}</>}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export default OrderHistory;