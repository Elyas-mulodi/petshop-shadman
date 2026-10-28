import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Field, FormError } from "../../auth/AuthParts";
import { useToast } from "../ui/ToastProvider";
import { useUpdateOrderStatus } from "../../../features/admin/orders/useAdminOrders";
import { ORDER_STATUS } from "../../../utils/orderStatus";
import { formatToman } from "../../../utils/price";
import { parseApiError } from "../../../utils/authHelpers";

const OPTIONS = {
  processing: { title: "شروع آماده‌سازی", text: "سفارش در حال بسته‌بندی است." },
  shipped: { title: "ارسال شد", text: "پیامک ارسال برای مشتری فرستاده می‌شود." },
  delivered: { title: "تحویل داده شد", text: "پیامک تحویل برای مشتری فرستاده می‌شود." },
  cancelled: { title: "لغو سفارش", text: "موجودی کالاها به انبار برمی‌گردد.", danger: true },
  returned: { title: "ثبت مرجوعی", text: "موجودی کالاها به انبار برمی‌گردد.", danger: true },
};

const StatusChangeDialog = ({ open, order, allowed, onClose }) => {
  const toast = useToast();
  const mutation = useUpdateOrderStatus(order._id);

  const [selected, setSelected] = useState(allowed[0]);
  const [carrier, setCarrier] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(allowed[0]);
    setCarrier(order.shipping?.carrier ?? "");
    setTrackingCode(order.shipping?.trackingCode ?? "");
    setError("");
  }, [open, allowed, order.shipping]);

  const reversal = selected === "cancelled" || selected === "returned";
  const paid = !!order.payment?.refId;

  const submit = () => {
    setError("");
    const payload = { status: selected };

    if (selected === "shipped") {
      if (carrier.trim()) payload.carrier = carrier.trim();
      if (trackingCode.trim()) payload.trackingCode = trackingCode.trim();
    }

    mutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(
          res.refundRequired
            ? "وضعیت ثبت شد. عودت وجه سفارش در انتظار انجام است."
            : "وضعیت سفارش به‌روز شد",
        );
        onClose();
      },
      onError: (err) => setError(parseApiError(err).message),
    });
  };

  return (
    <Modal
      open={open}
      title="تغییر وضعیت سفارش"
      description={`وضعیت فعلی: ${ORDER_STATUS[order.status]?.label ?? order.status}`}
      onClose={onClose}
      dismissible={!mutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            انصراف
          </Button>
          <Button
            variant={reversal ? "danger" : "primary"}
            onClick={submit}
            loading={mutation.isPending}
            disabled={!selected}
          >
            ثبت وضعیت
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="وضعیت جدید" className="space-y-2">
        {allowed.map((status) => {
          const option = OPTIONS[status];
          const active = status === selected;
          return (
            <button
              key={status}
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(status)}
              className={`w-full rounded-xl border px-4 py-3 text-start transition-colors ${
                active
                  ? option.danger
                    ? "border-danger/60 bg-danger/5"
                    : "border-bronze/60 bg-bronze/5"
                  : "border-line hover:border-line/80 hover:bg-well/40"
              }`}
            >
              <p className={`text-sm font-medium ${option.danger ? "text-danger" : "text-paper"}`}>{option.title}</p>
              <p className="mt-0.5 text-xs text-muted">{option.text}</p>
            </button>
          );
        })}
      </div>

      {selected === "shipped" && (
        <div className="mt-5">
          <Field
            label="پیک یا شرکت حمل (اختیاری)"
            list="carriers"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            maxLength={60}
          />
          <datalist id="carriers">
            <option value="پست پیشتاز" />
            <option value="تیپاکس" />
            <option value="چاپار" />
            <option value="پیک موتوری" />
          </datalist>
          <Field
            label="کد رهگیری (اختیاری)"
            dir="ltr"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            maxLength={60}
          />
        </div>
      )}

      {reversal && paid && (
        <p className="mt-5 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-3 text-xs leading-6 text-paper">
          مبلغ {formatToman(order.totalAmount)} از مشتری دریافت شده است. بعد از ثبت، سفارش در لیست «عودت وجه در انتظار» می‌ماند
          و باید مبلغ را از پنل زرین‌پال برگردانید و همین‌جا انجام‌شدنش را ثبت کنید.
        </p>
      )}

      <div className="mt-4">
        <FormError message={error} />
      </div>
    </Modal>
  );
};

export default StatusChangeDialog;