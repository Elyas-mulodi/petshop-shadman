import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, Check, Copy, PackageX, PawPrint, ShoppingBag } from "lucide-react";
import Button from "../../components/admin/ui/Button";
import Modal from "../../components/admin/ui/Modal";
import { useToast } from "../../components/admin/ui/ToastProvider";
import StatusBadge from "../../components/orders/StatusBadge";
import StatusChangeDialog from "../../components/admin/orders/StatusChangeDialog";
import OrderHistory from "../../components/admin/orders/OrderHistory";
import {
  AddressCard,
  CustomerCard,
  NotesCard,
  PaymentCard,
  ShippingCard,
} from "../../components/admin/orders/OrderSidePanels";
import { Card } from "../../components/profile/ProfileParts";
import { TextAreaField } from "../../components/checkout/FormControls";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { useAdminOrder, useMarkRefunded } from "../../features/admin/orders/useAdminOrder";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { formatDateTime } from "../../utils/formatDate";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const Alert = ({ tone = "danger", title, children, action }) => (
  <div
    role="status"
    className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3.5 ${
      tone === "danger" ? "border-danger/40 bg-danger/5" : "border-bronze/40 bg-bronze/5"
    }`}
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "danger" ? "text-danger" : "text-bronze"}`} />
      <div>
        <p className="text-sm font-medium text-paper">{title}</p>
        <p className="mt-1 text-xs leading-6 text-muted">{children}</p>
      </div>
    </div>
    {action}
  </div>
);

const SummaryRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between text-sm">
    <dt className="text-muted">{label}</dt>
    <dd className={accent ? "text-bronze" : "text-paper"}>{value}</dd>
  </div>
);

// ---------- ثبت انجام عودت وجه ----------
const RefundDialog = ({ open, order, onClose }) => {
  const toast = useToast();
  const mutation = useMarkRefunded(order._id);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    setError("");
    mutation.mutate(note.trim() ? { note: note.trim() } : {}, {
      onSuccess: () => {
        toast.success("عودت وجه ثبت شد");
        setNote("");
        onClose();
      },
      onError: (err) => setError(parseApiError(err).message),
    });
  };

  return (
    <Modal
      open={open}
      title="ثبت عودت وجه"
      description={`مبلغ ${formatToman(order.totalAmount)} را از پنل زرین‌پال به مشتری برگردانده‌اید؟`}
      onClose={onClose}
      dismissible={!mutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            انصراف
          </Button>
          <Button variant="primary" onClick={submit} loading={mutation.isPending}>
            عودت انجام شد
          </Button>
        </>
      }
    >
      <TextAreaField
        label="توضیح (اختیاری، مثلاً کد پیگیری عودت)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        error={error}
      />
    </Modal>
  );
};

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAdminOrder(id);
  const [statusOpen, setStatusOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/admin"));

  const BackButton = (
    <button
      onClick={goBack}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-paper"
    >
      <ArrowRight className="h-4 w-4" />
      بازگشت
    </button>
  );

  if (isLoading) {
    return (
      <>
        <Skeleton className="mb-5 h-5 w-20" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </>
    );
  }

  if (error?.response?.status === 404) {
    return (
      <>
        {BackButton}
        <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
          <PackageX className="mb-4 h-10 w-10 text-sage" strokeWidth={1.3} />
          <p className="font-display text-base font-bold text-paper">سفارش پیدا نشد</p>
        </div>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        {BackButton}
        <ErrorState message="دریافت اطلاعات سفارش با خطا مواجه شد" onRetry={refetch} />
      </>
    );
  }

  const { order, allowedTransitions, customerStats } = data;
  const refundPending = order.refund?.required && !order.refund.doneAt;
  const refundDone = order.refund?.required && order.refund.doneAt;
  const stockIssue = order.stockIssue && ["paid", "processing"].includes(order.status);
  const discountLabel =
    order.discountSource === "coupon"
      ? `کد تخفیف${order.couponCode ? ` (${order.couponCode})` : ""}`
      : "تخفیف وفاداری";

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // کلیپ‌بورد ممکنه توسط مرورگر بلاک شده باشه
    }
  };

  return (
    <>
      {BackButton}

      <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 dir="ltr" className="font-display text-xl font-bold text-paper md:text-2xl">
                {order.orderNumber}
              </h1>
              <button
                onClick={copyNumber}
                aria-label="کپی شماره سفارش"
                className="text-muted transition-colors hover:text-paper"
              >
                {copied ? <Check className="h-4 w-4 text-sage" /> : <Copy className="h-4 w-4" />}
              </button>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-2 text-xs text-muted">ثبت‌شده در {formatDateTime(order.createdAt)}</p>
          </div>

          {allowedTransitions.length > 0 && (
            <Button variant="primary" onClick={() => setStatusOpen(true)}>
              تغییر وضعیت
            </Button>
          )}
        </div>
      </section>

      <div className="mt-6 space-y-3">
        {stockIssue && (
          <Alert title="کمبود موجودی بعد از پرداخت">
            این سفارش پرداخت شده ولی موجودی بعضی کالاها کافی نبوده (موجودی آن‌ها منفی شده است). موجودی را بررسی کنید؛ اگر
            تامین ممکن نیست، سفارش را لغو کنید و مبلغ را عودت دهید.
          </Alert>
        )}

        {refundPending && (
          <Alert
            title="عودت وجه در انتظار انجام"
            action={
              <Button size="sm" variant="primary" onClick={() => setRefundOpen(true)}>
                ثبت انجام عودت
              </Button>
            }
          >
            این سفارش بعد از پرداخت {order.status === "returned" ? "مرجوع" : "لغو"} شده است. مبلغ {formatToman(order.totalAmount)} را
            از پنل زرین‌پال به مشتری برگردانید و سپس انجامش را ثبت کنید.
          </Alert>
        )}

        {refundDone && (
          <Alert tone="info" title="عودت وجه انجام شد">
            {formatDateTime(order.refund.doneAt)}
            {order.refund.doneBy && <> ، {order.refund.doneBy.name || order.refund.doneBy.phone}</>}
            {order.refund.note && <> ، {order.refund.note}</>}
          </Alert>
        )}

        {order.status === "pending_payment" && (
          <Alert tone="info" title="در انتظار پرداخت مشتری">
            {order.expiresAt
              ? `اگر تا ${formatDateTime(order.expiresAt)} پرداخت نشود، سفارش منقضی می‌شود.`
              : "مشتری هنوز پرداخت را انجام نداده است."}
          </Alert>
        )}
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <OrderHistory order={order} />

          <Card icon={ShoppingBag} title={`کالاهای سفارش (${toPersianDigits(order.items.length)})`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th scope="col" className="pb-3 text-start font-medium">کالا</th>
                    <th scope="col" className="pb-3 text-end font-medium">قیمت واحد</th>
                    <th scope="col" className="pb-3 text-center font-medium">تعداد</th>
                    <th scope="col" className="pb-3 text-end font-medium">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => {
                    const image = getImageUrl(item.image);
                    return (
                      <tr key={`${item.variantId}-${i}`} className="border-b border-line last:border-b-0">
                        <td className="py-3 pl-3">
                          <div className="flex items-center gap-3">
                            {image ? (
                              <img src={image} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-well">
                                <PawPrint className="h-5 w-5 text-sage" strokeWidth={1.4} />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-paper">{item.productName}</p>
                              {item.attributes?.length > 0 && (
                                <p className="mt-0.5 text-xs text-muted">
                                  {item.attributes.map((a) => `${a.name}: ${a.value}`).join("، ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-end text-muted">{formatToman(item.unitPrice)}</td>
                        <td className="py-3 text-center text-paper">{toPersianDigits(item.quantity)}</td>
                        <td className="py-3 text-end text-paper">{formatToman(item.lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-5">
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
          </Card>
        </div>

        <div className="space-y-6">
          <CustomerCard user={order.user} stats={customerStats} />
          <AddressCard address={order.shippingAddress} />
          <PaymentCard order={order} />
          <ShippingCard
            key={`${order.shipping?.carrier}|${order.shipping?.trackingCode}`}
            order={order}
          />
          <NotesCard order={order} />
        </div>
      </div>

      {allowedTransitions.length > 0 && (
        <StatusChangeDialog
          open={statusOpen}
          order={order}
          allowed={allowedTransitions}
          onClose={() => setStatusOpen(false)}
        />
      )}
      {refundPending && <RefundDialog open={refundOpen} order={order} onClose={() => setRefundOpen(false)} />}
    </>
  );
};

export default AdminOrderDetailPage;