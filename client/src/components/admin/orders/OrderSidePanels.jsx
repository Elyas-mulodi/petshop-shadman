import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, CreditCard, MapPin, StickyNote, Truck, User } from "lucide-react";
import { Card } from "../../profile/ProfileParts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { useToast } from "../ui/ToastProvider";
import { Field } from "../../auth/AuthParts";
import { TextAreaField } from "../../checkout/FormControls";
import { useAddOrderNote, useUpdateShipping } from "../../../features/admin/orders/useAdminOrder";
import { formatToman } from "../../../utils/price";
import { formatDate, formatDateTime } from "../../../utils/formatDate";
import { parseApiError, toPersianDigits } from "../../../utils/authHelpers";

const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <dt className="shrink-0 text-muted">{label}</dt>
    <dd className="text-end text-paper">{children}</dd>
  </div>
);

// ---------- مشتری ----------
export const CustomerCard = ({ user, stats }) => (
  <Card icon={User} title="مشتری">
    {user ? (
      <>
        <dl className="space-y-3">
          <Row label="نام">{user.name || "بدون نام"}</Row>
          <Row label="موبایل حساب">
            <span dir="ltr">{user.phone}</span>
          </Row>
          {user.email && (
            <Row label="ایمیل">
              <span dir="ltr">{user.email}</span>
            </Row>
          )}
          <Row label="عضو از">{formatDate(user.createdAt)}</Row>
          <Row label="سفارش‌های موفق">{toPersianDigits(stats.orders)}</Row>
          <Row label="مجموع خرید">{formatToman(stats.spent)}</Row>
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          {user.isBlocked ? <Badge tone="danger">حساب مسدود است</Badge> : <span />}
          <Link
            to={`/admin/users?search=${encodeURIComponent(user.phone)}`}
            className="text-xs text-bronze transition-opacity hover:opacity-80"
          >
            مشاهده در کاربران
          </Link>
        </div>
      </>
    ) : (
      <p className="text-sm text-muted">اطلاعات مشتری در دسترس نیست.</p>
    )}
  </Card>
);

// ---------- آدرس ----------
export const AddressCard = ({ address }) => {
  const [copied, setCopied] = useState(false);
  if (!address) return null;

  const copy = async () => {
    const text = [
      address.fullName,
      address.phone,
      `${address.province}، ${address.city}`,
      address.addressLine,
      `کد پستی: ${address.postalCode}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // کلیپ‌بورد ممکنه توسط مرورگر بلاک شده باشه
    }
  };

  return (
    <Card icon={MapPin} title="آدرس تحویل">
      <p className="text-sm font-medium text-paper">{address.fullName}</p>
      <p dir="ltr" className="mt-1 text-right text-xs text-muted">
        {address.phone}
      </p>
      <p className="mt-3 text-sm leading-7 text-paper">
        {address.province}، {address.city}، {address.addressLine}
      </p>
      <p className="mt-2 text-xs text-muted">کد پستی: {toPersianDigits(address.postalCode)}</p>
      <Button size="sm" className="mt-4" icon={copied ? Check : Copy} onClick={copy}>
        {copied ? "کپی شد" : "کپی آدرس"}
      </Button>
    </Card>
  );
};

// ---------- پرداخت ----------
export const PaymentCard = ({ order }) => (
  <Card icon={CreditCard} title="پرداخت">
    {order.payment?.refId ? (
      <dl className="space-y-3">
        <Row label="وضعیت">
          <Badge tone="success">پرداخت شده</Badge>
        </Row>
        <Row label="مبلغ">{formatToman(order.totalAmount)}</Row>
        <Row label="کد پیگیری">
          <span dir="ltr">{order.payment.refId}</span>
        </Row>
        {order.payment.paidAt && <Row label="زمان پرداخت">{formatDateTime(order.payment.paidAt)}</Row>}
      </dl>
    ) : (
      <p className="text-sm text-muted">این سفارش پرداخت نشده است.</p>
    )}
  </Card>
);

// ---------- ارسال ----------
const SHIPPING_EDITABLE = ["paid", "processing", "shipped", "delivered"];

export const ShippingCard = ({ order }) => {
  const toast = useToast();
  const mutation = useUpdateShipping(order._id);
  const [carrier, setCarrier] = useState(order.shipping?.carrier ?? "");
  const [trackingCode, setTrackingCode] = useState(order.shipping?.trackingCode ?? "");
  const [error, setError] = useState("");

  const editable = SHIPPING_EDITABLE.includes(order.status);
  const changed =
    carrier.trim() !== (order.shipping?.carrier ?? "") || trackingCode.trim() !== (order.shipping?.trackingCode ?? "");

  const save = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate(
      { carrier: carrier.trim(), trackingCode: trackingCode.trim() },
      {
        onSuccess: () => toast.success("اطلاعات ارسال ذخیره شد"),
        onError: (err) => setError(parseApiError(err).message),
      },
    );
  };

  return (
    <Card icon={Truck} title="ارسال">
      {editable ? (
        <form onSubmit={save} noValidate>
          <Field label="پیک یا شرکت حمل" list="carriers-edit" value={carrier} onChange={(e) => setCarrier(e.target.value)} maxLength={60} />
          <datalist id="carriers-edit">
            <option value="پست پیشتاز" />
            <option value="تیپاکس" />
            <option value="چاپار" />
            <option value="پیک موتوری" />
          </datalist>
          <Field label="کد رهگیری" dir="ltr" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} maxLength={60} error={error} />
          {order.shipping?.shippedAt && (
            <p className="-mt-1 mb-4 text-xs text-muted">زمان ارسال: {formatDateTime(order.shipping.shippedAt)}</p>
          )}
          <Button type="submit" variant="secondary" loading={mutation.isPending} disabled={!changed} className="w-full">
            ذخیره
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted">بعد از پرداخت سفارش، اطلاعات ارسال قابل ثبت است.</p>
      )}
    </Card>
  );
};

// ---------- یادداشت داخلی ----------
export const NotesCard = ({ order }) => {
  const toast = useToast();
  const mutation = useAddOrderNote(order._id);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const notes = [...(order.adminNotes ?? [])].reverse();

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");

    mutation.mutate(
      { text: text.trim() },
      {
        onSuccess: () => {
          setText("");
          toast.success("یادداشت ثبت شد");
        },
        onError: (err) => setError(parseApiError(err).message),
      },
    );
  };

  return (
    <Card
      icon={StickyNote}
      title="یادداشت داخلی"
      hint="فقط ادمین‌ها می‌بینند و بعد از ثبت قابل ویرایش یا حذف نیست."
    >
      <form onSubmit={submit} noValidate>
        <TextAreaField
          label="یادداشت جدید"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          error={error}
        />
        <Button type="submit" variant="secondary" loading={mutation.isPending} disabled={!text.trim()} className="w-full">
          ثبت یادداشت
        </Button>
      </form>

      {notes.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-line pt-5">
          {notes.map((note) => (
            <li key={note._id} className="rounded-lg bg-ink px-3.5 py-3">
              <p className="whitespace-pre-wrap text-sm leading-7 text-paper">{note.text}</p>
              <p className="mt-2 text-[11px] text-muted">
                {note.by?.name || note.by?.phone || "ادمین"} ، {formatDateTime(note.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};