import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import { useToast } from "../ui/ToastProvider";
import { Field, FormError } from "../../auth/AuthParts";
import { useSaveTier } from "../../../features/admin/loyalty/useLoyaltyTiers";
import { toNumber } from "../../../features/admin/products/productForm";
import { formatToman } from "../../../utils/price";
import { normalizeDigits, parseApiError } from "../../../utils/authHelpers";

export const parsePercent = (value) => {
  const text = normalizeDigits(String(value ?? ""))
    .replace("٫", ".")
    .trim();
  return /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : NaN;
};

const TierFormModal = ({ open, tier, onClose }) => {
  const toast = useToast();
  const save = useSaveTier();
  const isEdit = !!tier;

  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(tier ? String(tier.minOrderAmount) : "");
    setPercent(tier ? String(tier.discountPercent) : "");
    setIsActive(tier?.isActive ?? true);
    setErrors({});
    setServerError("");
  }, [open, tier]);

  const amountValue = toNumber(amount);

  const submit = (e) => {
    e.preventDefault();

    const found = {};
    const min = toNumber(amount);
    const pct = parsePercent(percent);

    if (Number.isNaN(min))
      found.minOrderAmount = "مبلغ را به‌صورت عدد صحیح وارد کنید";
    else if (min > 1_000_000_000)
      found.minOrderAmount = "مبلغ بیش از حد مجاز است";

    if (Number.isNaN(pct) || pct <= 0)
      found.discountPercent = "درصد تخفیف را بیشتر از صفر وارد کنید";
    else if (pct > 100)
      found.discountPercent = "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError("");
    save.mutate(
      {
        id: tier?._id,
        body: { minOrderAmount: min, discountPercent: pct, isActive },
      },
      {
        onSuccess: () => {
          toast.success(isEdit ? "پله ذخیره شد" : "پله ساخته شد");
          onClose();
        },
        onError: (err) => {
          const data = err?.response?.data;
          if (err?.response?.status === 409)
            setErrors({ minOrderAmount: data?.message });
          else if (data?.errors)
            setErrors((prev) => ({ ...prev, ...data.errors }));
          setServerError(parseApiError(err).message);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "ویرایش پله" : "پله‌ی جدید"}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={save.isPending}
          >
            انصراف
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="tier-form"
            loading={save.isPending}
          >
            {isEdit ? "ذخیره" : "ساخت"}
          </Button>
        </>
      }
    >
      <form id="tier-form" onSubmit={submit} noValidate>
        <Field
          label="حداقل جمع کالاهای سفارش (تومان)"
          dir="ltr"
          inputMode="numeric"
          value={amount}
          error={errors.minOrderAmount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {Number.isFinite(amountValue) &&
          amountValue >= 0 &&
          amount.trim() !== "" && (
            <p className="-mt-2 mb-4 text-[11px] text-muted">
              {formatToman(amountValue)}
            </p>
          )}

        <Field
          label="درصد تخفیف برای سفارش بعدی"
          dir="ltr"
          inputMode="decimal"
          value={percent}
          error={errors.discountPercent}
          onChange={(e) => setPercent(e.target.value)}
        />

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-ink/40 px-3.5 py-3">
          <div>
            <p className="text-sm text-paper">
              {isActive ? "فعال" : "غیرفعال"}
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {isActive
                ? "در محاسبه‌ی تخفیف مشتری‌ها در نظر گرفته می‌شود."
                : "در محاسبه و صفحه‌ی مشتری نمایش داده نمی‌شود."}
            </p>
          </div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="فعال بودن پله"
          />
        </div>

        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      </form>
    </Modal>
  );
};

export default TierFormModal;
