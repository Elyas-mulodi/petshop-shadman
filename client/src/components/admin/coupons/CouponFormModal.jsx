import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import { Segmented } from "../dashboard/Panel";
import { useToast } from "../ui/ToastProvider";
import { Field, FormError } from "../../auth/AuthParts";
import { useSaveCoupon } from "../../../features/admin/coupons/useAdminCoupons";
import {
  couponToForm,
  emptyCouponForm,
  formToCouponPayload,
  generateCouponCode,
  previewDiscount,
  validateCouponForm,
} from "../../../features/admin/coupons/couponForm";
import { toNumber } from "../../../features/admin/products/productForm";
import { formatToman } from "../../../utils/price";
import { parseApiError, toPersianDigits } from "../../../utils/authHelpers";
import { formatDayLong, isDay } from "../../../utils/tehranDate";

const TYPE_OPTIONS = [
  { id: "percentage", label: "درصدی" },
  { id: "fixed", label: "مبلغ ثابت" },
];

const dateInput =
  "w-full rounded-lg border bg-ink px-3 py-2 text-sm text-paper [color-scheme:dark] focus:outline-none";

const Hint = ({ children }) => <p className="-mt-2 mb-4 text-[11px] leading-5 text-muted">{children}</p>;

const CouponFormModal = ({ open, coupon, onClose }) => {
  const toast = useToast();
  const save = useSaveCoupon();
  const isEdit = !!coupon;
  const usedCount = coupon?.usedCount ?? 0;

  const [form, setForm] = useState(emptyCouponForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(coupon ? couponToForm(coupon) : emptyCouponForm());
    setErrors({});
    setServerError("");
  }, [open, coupon]);

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setServerError("");
  };

  const percentage = form.discountType === "percentage";
  const value = toNumber(form.discountValue);
  const minCart = toNumber(form.minCartAmount);

  // نمونه‌ی محاسبه: سبدی به‌اندازه‌ی حداقل مبلغ (یا یک میلیون تومان، هرکدوم بیشتر بود)
  const sampleCart = Math.max(1_000_000, Number.isFinite(minCart) ? minCart : 0);
  const sampleDiscount = previewDiscount(form, sampleCart);

  const submit = (e) => {
    e.preventDefault();

    const found = validateCouponForm(form, { usedCount });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError("");
    save.mutate(
      { id: coupon?._id, body: formToCouponPayload(form) },
      {
        onSuccess: () => {
          toast.success(isEdit ? "کد تخفیف ذخیره شد" : "کد تخفیف ساخته شد");
          onClose();
        },
        onError: (err) => {
          const data = err?.response?.data;
          if (data?.errors) setErrors((prev) => ({ ...prev, ...data.errors }));
          else if (err?.response?.status === 409) setErrors((prev) => ({ ...prev, code: data?.message }));
          setServerError(parseApiError(err).message);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}
      description={isEdit && usedCount > 0 ? `این کد تاکنون ${toPersianDigits(usedCount)} بار استفاده شده است.` : undefined}
      width="max-w-xl"
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            انصراف
          </Button>
          <Button variant="primary" type="submit" form="coupon-form" loading={save.isPending}>
            {isEdit ? "ذخیره" : "ساخت کد"}
          </Button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={submit} noValidate>
        <Field
          label="کد تخفیف"
          dir="ltr"
          value={form.code}
          maxLength={20}
          error={errors.code}
          readOnly={isEdit && usedCount > 0}
          className={isEdit && usedCount > 0 ? "cursor-not-allowed opacity-60" : ""}
          onChange={(e) => update({ code: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() })}
        />
        {isEdit && usedCount > 0 ? (
          <Hint>کدی که استفاده شده تغییر نمی‌کند؛ برای کد دیگر، کد جدید بسازید.</Hint>
        ) : (
          <button
            type="button"
            onClick={() => update({ code: generateCouponCode() })}
            className="-mt-2 mb-4 text-xs text-bronze transition-opacity hover:opacity-80"
          >
            ساخت کد تصادفی
          </button>
        )}

        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-muted">نوع تخفیف</span>
          <Segmented
            value={form.discountType}
            onChange={(discountType) => update({ discountType })}
            options={TYPE_OPTIONS}
            ariaLabel="نوع تخفیف"
          />
        </div>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <div>
            <Field
              label={percentage ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
              dir="ltr"
              inputMode="numeric"
              value={form.discountValue}
              error={errors.discountValue}
              onChange={(e) => update({ discountValue: e.target.value })}
            />
            {!percentage && Number.isFinite(value) && value > 0 && <Hint>{formatToman(value)}</Hint>}
          </div>

          {percentage && (
            <div>
              <Field
                label="سقف مبلغ تخفیف (اختیاری)"
                dir="ltr"
                inputMode="numeric"
                value={form.maxDiscountAmount}
                error={errors.maxDiscountAmount}
                onChange={(e) => update({ maxDiscountAmount: e.target.value })}
              />
              <Hint>مثلاً ۱۰٪ تا سقف ۱۰۰ هزار تومان</Hint>
            </div>
          )}
        </div>

        <Field
          label="حداقل مبلغ سبد (اختیاری، تومان)"
          dir="ltr"
          inputMode="numeric"
          value={form.minCartAmount}
          error={errors.minCartAmount}
          onChange={(e) => update({ minCartAmount: e.target.value })}
        />
        {Number.isFinite(minCart) && minCart > 0 && <Hint>{formatToman(minCart)}</Hint>}

        <div className="grid gap-x-4 sm:grid-cols-2">
          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-medium text-muted">شروع (اختیاری)</span>
            <input
              type="date"
              value={form.startsAt}
              onChange={(e) => update({ startsAt: e.target.value })}
              aria-label="تاریخ شروع"
              className={`${dateInput} border-line focus:border-bronze`}
            />
            {isDay(form.startsAt) && <p className="mt-1 text-[11px] text-muted">از {formatDayLong(form.startsAt)}</p>}
          </div>

          <div className="mb-4">
            <span className="mb-1.5 block text-xs font-medium text-muted">پایان (اختیاری)</span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => update({ expiresAt: e.target.value })}
              aria-label="تاریخ پایان"
              className={`${dateInput} ${errors.expiresAt ? "border-danger" : "border-line focus:border-bronze"}`}
            />
            {errors.expiresAt ? (
              <p className="mt-1 text-xs text-danger">{errors.expiresAt}</p>
            ) : (
              isDay(form.expiresAt) && <p className="mt-1 text-[11px] text-muted">تا پایان {formatDayLong(form.expiresAt)}</p>
            )}
          </div>
        </div>

        <Field
          label="سقف تعداد کل استفاده (اختیاری)"
          dir="ltr"
          inputMode="numeric"
          value={form.usageLimit}
          error={errors.usageLimit}
          onChange={(e) => update({ usageLimit: e.target.value })}
        />
        <Hint>
          مثلاً ۱۰۰ یعنی ۱۰۰ نفر اول. هر کاربر فقط یک‌بار می‌تواند از هر کد استفاده کند. اگر چند نفر هم‌زمان آخرین ظرفیت را
          بگیرند، ممکن است تعداد استفاده کمی از سقف بیشتر شود.
        </Hint>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-ink/40 px-3.5 py-3">
          <div>
            <p className="text-sm text-paper">{form.isActive ? "فعال" : "غیرفعال"}</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {form.isActive ? "مشتری می‌تواند در زمان اعتبار از کد استفاده کند." : "کد برای مشتری نامعتبر است."}
            </p>
          </div>
          <Switch checked={form.isActive} onChange={(isActive) => update({ isActive })} label="فعال بودن کد" />
        </div>

        {sampleDiscount !== null && (
          <p className="mt-4 rounded-lg border border-line bg-ink/40 px-3.5 py-3 text-xs leading-6 text-muted">
            نمونه: برای سبد {formatToman(sampleCart)}، تخفیف <span className="text-bronze">{formatToman(sampleDiscount)}</span> و
            مبلغ کالا بعد از تخفیف {formatToman(sampleCart - sampleDiscount)} می‌شود. هزینه‌ی ارسال جدا اضافه می‌شود و تخفیف
            نمی‌خورد.
          </p>
        )}

        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      </form>
    </Modal>
  );
};

export default CouponFormModal;