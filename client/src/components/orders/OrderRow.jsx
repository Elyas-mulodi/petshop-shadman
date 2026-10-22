import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Loader2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { CheckoutItems } from "../checkout/CheckoutSummary";
import { formatToman } from "../../utils/price";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";
import { Link } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1];

const SummaryRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between text-sm">
    <dt className="text-muted">{label}</dt>
    <dd className={accent ? "text-bronze" : "text-paper"}>{value}</dd>
  </div>
);

const OrderRow = ({ order, open, onToggle, onPay, onCancel }) => {
  const [busy, setBusy] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState("");

  const isPending = order.status === "pending_payment";
  const address = order.shippingAddress;

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
      await onPay(order._id); 
    } catch (err) {
      setError(parseApiError(err).message);
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setError("");
    setBusy("cancel");
    try {
      await onCancel(order._id);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setBusy(null);
      setConfirmCancel(false);
    }
  };

  const discountLabel =
    order.discountSource === "coupon"
      ? `کد تخفیف${order.couponCode ? ` (${order.couponCode})` : ""}`
      : "تخفیف وفاداری";

  return (
    <div className="border-b border-line last:border-b-0">
      {/* ردیف جدول */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-3 px-4 py-3.5 text-right transition-colors hover:bg-well/50 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:gap-4"
      >
        <span className="flex flex-col gap-0.5 md:contents">
          <span dir="ltr" className="block text-right text-sm font-medium text-paper">
            {order.orderNumber}
          </span>
          <span className="text-xs text-muted md:text-sm">{formatDate(order.createdAt)}</span>
        </span>

        <span className="flex flex-col items-end gap-1.5 md:contents">
          <span className="text-sm font-medium text-bronze md:order-4 md:font-normal md:text-paper">
            {formatToman(order.totalAmount)}
          </span>
          <span className="md:order-3">
            <StatusBadge status={order.status} />
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 md:order-5 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* جزئیات */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 border-t border-line bg-ink/40 p-4 md:grid-cols-2 md:p-5">
              <div>
                <p className="mb-3 text-xs font-medium text-muted">کالاهای سفارش</p>
                <CheckoutItems items={order.items} />
              </div>

              <div className="flex flex-col gap-5">
                <dl className="flex flex-col gap-2.5">
                  <SummaryRow label="جمع کالاها" value={formatToman(order.subtotal)} />
                  {order.discountAmount > 0 && (
                    <SummaryRow label={discountLabel} value={`−${formatToman(order.discountAmount)}`} accent />
                  )}
                  <SummaryRow
                    label="هزینه ارسال"
                    value={order.shippingCost === 0 ? "رایگان" : formatToman(order.shippingCost)}
                  />
                  <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                    <dt className="text-paper">مبلغ کل</dt>
                    <dd className="font-bold text-bronze">{formatToman(order.totalAmount)}</dd>
                  </div>
                </dl>

                {address && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">آدرس تحویل</p>
                    <p className="text-sm text-paper">
                      {address.fullName} ·{" "}
                      <span dir="ltr" className="inline-block">
                        {address.phone}
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {address.province}، {address.city}، {address.addressLine}
                    </p>
                    <p className="text-xs text-muted">کد پستی: {toPersianDigits(address.postalCode)}</p>
                  </div>
                )}

                {order.payment?.refId && (
                  <p className="text-xs text-muted">
                    کد پیگیری پرداخت:{" "}
                    <span dir="ltr" className="inline-block font-medium text-paper">
                      {order.payment.refId}
                    </span>
                    {order.payment.paidAt && <> · {formatDateTime(order.payment.paidAt)}</>}
                  </p>
                )}

                {isPending && (
                  <div className="rounded-lg border border-bronze/30 bg-bronze/5 p-3.5">
                    <p className="mb-3 text-xs leading-6 text-muted">
                      پرداخت این سفارش هنوز انجام نشده است.
                      {order.expiresAt && (
                        <> اگر تا {formatDateTime(order.expiresAt)} پرداخت نشود، به‌صورت خودکار حذف می‌شود.</>
                      )}
                    </p>

                    {error && (
                      <p role="alert" className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs leading-6 text-danger">
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
                          {busy === "cancel" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
                        <button
                          onClick={handlePay}
                          disabled={busy !== null}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          {busy === "pay" && <Loader2 className="h-4 w-4 animate-spin" />}
                          {busy === "pay" ? "در حال انتقال..." : "پرداخت مجدد"}
                        </button>
                        <button
                          onClick={() => setConfirmCancel(true)}
                          disabled={busy !== null}
                          className="rounded-lg border border-line px-4 py-2.5 text-sm text-paper transition-colors hover:border-danger/60 hover:text-danger disabled:opacity-60"
                        >
                          لغو سفارش
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderRow;