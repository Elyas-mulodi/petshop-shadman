import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  cancelOrder,
  retryOrderPayment,
} from "../../features/orders/ordersApi";
import { redirectTo } from "../../utils/redirect";
import { formatDateTime } from "../../utils/formatDate";
import { parseApiError } from "../../utils/authHelpers";

const PendingPaymentBox = ({ order, onCancelled }) => {
  const [busy, setBusy] = useState(null); 
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState("");

  const expired = order.expiresAt && new Date(order.expiresAt) < new Date();

  useEffect(() => {
    if (busy !== "pay") return;
    const onPageShow = (e) => e.persisted && setBusy(null);
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [busy]);

  const handlePay = async () => {
    setError("");
    setBusy("pay");
    try {
      const { data } = await retryOrderPayment(order._id);
      redirectTo(data.data.paymentUrl);
    } catch (err) {
      setError(parseApiError(err).message);
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setError("");
    setBusy("cancel");
    try {
      const { data } = await cancelOrder(order._id);
      onCancelled(data.data.status);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setBusy(null);
      setConfirmCancel(false);
    }
  };

  return (
    <div className="rounded-2xl border border-bronze/30 bg-bronze/5 p-5">
      <p className="mb-1.5 text-sm font-medium text-paper">
        پرداخت این سفارش انجام نشده است
      </p>
      <p className="mb-4 text-xs leading-6 text-muted">
        {expired
          ? "مهلت پرداخت تمام شده است. سفارش را لغو کنید و دوباره ثبت کنید."
          : order.expiresAt
            ? `اگر تا ${formatDateTime(order.expiresAt)} پرداخت نشود، سفارش به‌صورت خودکار حذف می‌شود.`
            : "برای نهایی شدن سفارش، پرداخت را انجام دهید."}
      </p>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs leading-6 text-danger"
        >
          {error}
        </p>
      )}

      {confirmCancel ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-paper">سفارش لغو شود؟</span>
          <button
            onClick={handleCancel}
            disabled={busy === "cancel"}
            className="flex items-center gap-1.5 rounded-lg bg-danger px-4 py-2 text-xs font-medium text-ink disabled:opacity-60"
          >
            {busy === "cancel" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            بله، لغو شود
          </button>
          <button
            onClick={() => setConfirmCancel(false)}
            disabled={busy === "cancel"}
            className="rounded-lg border border-line px-4 py-2 text-xs text-paper disabled:opacity-60"
          >
            انصراف
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {!expired && (
            <button
              onClick={handlePay}
              disabled={busy !== null}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy === "pay" && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy === "pay" ? "در حال انتقال..." : "پرداخت مجدد"}
            </button>
          )}
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={busy !== null}
            className={`rounded-lg border border-line px-4 py-2.5 text-sm text-paper transition-colors hover:border-danger/60 hover:text-danger disabled:opacity-60 ${
              expired ? "flex-1" : ""
            }`}
          >
            لغو سفارش
          </button>
        </div>
      )}
    </div>
  );
};

export default PendingPaymentBox;
