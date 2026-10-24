import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  MapPin,
  PackageX,
  ShoppingBag,
} from "lucide-react";
import StatusBadge from "../../components/orders/StatusBadge";
import OrderTimeline from "../../components/orders/OrderTimeline";
import PendingPaymentBox from "../../components/orders/PendingPaymentBox";
import { CheckoutItems } from "../../components/checkout/CheckoutSummary";
import { Card } from "../../components/profile/ProfileParts";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { getOrderById } from "../../features/orders/ordersApi";
import { formatToman } from "../../utils/price";
import { formatDateTime } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";

const BackLink = () => (
  <Link
    to="/profile?tab=orders"
    className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-paper"
  >
    <ArrowRight className="h-4 w-4" />
    سفارش‌های من
  </Link>
);

const SummaryRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between text-sm">
    <dt className="text-muted">{label}</dt>
    <dd className={accent ? "text-bronze" : "text-paper"}>{value}</dd>
  </div>
);

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return getOrderById(id)
      .then((res) => setOrder(res.data.data))
      .catch((err) => {
        const status = err?.response?.status;
        setError(status === 404 || status === 403 ? "not-found" : "failed");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
        <Skeleton className="mb-5 h-5 w-28" />
        <Skeleton className="h-52 rounded-2xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error === "not-found") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
          <PackageX className="mb-5 h-12 w-12 text-sage" strokeWidth={1.3} />
          <h1 className="font-display text-lg font-bold text-paper">
            سفارش پیدا نشد
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-7 text-muted">
            این سفارش وجود ندارد یا متعلق به حساب دیگری است.
          </p>
          <Link
            to="/profile?tab=orders"
            className="mt-6 rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            بازگشت به سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
        <BackLink />
        <ErrorState
          message="دریافت اطلاعات سفارش با خطا مواجه شد"
          onRetry={load}
        />
      </div>
    );
  }

  const isPending = order.status === "pending_payment";
  const isClosed = ["cancelled", "returned", "expired"].includes(order.status);
  const address = order.shippingAddress;
  const discountLabel =
    order.discountSource === "coupon"
      ? `کد تخفیف${order.couponCode ? ` (${order.couponCode})` : ""}`
      : "تخفیف وفاداری";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
      <BackLink />

      <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1
                dir="ltr"
                className="font-display text-xl font-bold text-paper md:text-2xl"
              >
                {order.orderNumber}
              </h1>
              <button
                onClick={copyNumber}
                aria-label="کپی شماره سفارش"
                className="text-muted transition-colors hover:text-paper"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-sage" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              ثبت‌شده در {formatDateTime(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-6 border-t border-line pt-6">
          {isClosed ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {order.status === "returned"
                ? "این سفارش مرجوع شده است."
                : order.status === "expired"
                  ? "مهلت پرداخت این سفارش تمام شده است."
                  : "این سفارش لغو شده است."}
            </p>
          ) : (
            <OrderTimeline order={order} />
          )}
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card
          icon={ShoppingBag}
          title={`کالاهای سفارش (${toPersianDigits(order.items.length)})`}
        >
          <CheckoutItems items={order.items} />

          <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5">
            <SummaryRow
              label="جمع کالاها"
              value={formatToman(order.subtotal)}
            />
            {order.discountAmount > 0 && (
              <SummaryRow
                label={discountLabel}
                value={`−${formatToman(order.discountAmount)}`}
                accent
              />
            )}
            <SummaryRow
              label="هزینه ارسال"
              value={
                order.shippingCost === 0
                  ? "رایگان"
                  : formatToman(order.shippingCost)
              }
            />
            <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
              <dt className="text-paper">مبلغ کل</dt>
              <dd className="font-bold text-bronze">
                {formatToman(order.totalAmount)}
              </dd>
            </div>
          </dl>
        </Card>

        <div className="flex flex-col gap-6">
          {isPending && (
            <PendingPaymentBox
              order={order}
              onCancelled={(status) =>
                setOrder((prev) => ({ ...prev, status }))
              }
            />
          )}

          {address && (
            <Card icon={MapPin} title="آدرس تحویل">
              <p className="text-sm font-medium text-paper">
                {address.fullName}
              </p>
              <p dir="ltr" className="mt-1 text-right text-xs text-muted">
                {address.phone}
              </p>
              <p className="mt-3 text-sm leading-7 text-paper">
                {address.province}، {address.city}، {address.addressLine}
              </p>
              <p className="mt-2 text-xs text-muted">
                کد پستی: {toPersianDigits(address.postalCode)}
              </p>
            </Card>
          )}

          {order.payment?.refId && (
            <Card icon={CreditCard} title="اطلاعات پرداخت">
              <dl className="flex flex-col gap-2.5">
                <SummaryRow
                  label="کد پیگیری"
                  value={<span dir="ltr">{order.payment.refId}</span>}
                />
                {order.payment.paidAt && (
                  <SummaryRow
                    label="زمان پرداخت"
                    value={formatDateTime(order.payment.paidAt)}
                  />
                )}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
