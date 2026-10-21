// برچسب فارسی و رنگ هر وضعیت سفارش
export const ORDER_STATUS = {
  pending_payment: {
    label: "در انتظار پرداخت",
    tone: "border-bronze/50 bg-bronze/10 text-bronze",
  },
  paid: { label: "پرداخت‌شده", tone: "border-line bg-well text-paper" },
  processing: {
    label: "در حال آماده‌سازی",
    tone: "border-line bg-well text-paper",
  },
  shipped: { label: "ارسال‌شده", tone: "border-line bg-well text-paper" },
  delivered: {
    label: "تحویل‌شده",
    tone: "border-sage/50 bg-sage/10 text-sage",
  },
  cancelled: {
    label: "لغو شده",
    tone: "border-danger/40 bg-danger/10 text-danger",
  },
  returned: {
    label: "مرجوع شده",
    tone: "border-danger/40 bg-danger/10 text-danger",
  },
};
