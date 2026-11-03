import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Store, Truck } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import Button from "../../components/admin/ui/Button";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { Field, FormError } from "../../components/auth/AuthParts";
import { TextAreaField } from "../../components/checkout/FormControls";
import { Card } from "../../components/profile/ProfileParts";
import ErrorState from "../../components/common/ErrorState";
import Skeleton from "../../components/common/Skeleton";
import {
  useAdminSettings,
  useSaveSettings,
} from "../../features/admin/settings/useSettings";
import { useAuditLogs } from "../../features/admin/audit/useAuditLogs";
import { toNumber } from "../../features/admin/products/productForm";
import { useUnsavedWarning } from "../../hooks/useUnsavedWarning";
import { formatToman } from "../../utils/price";
import { formatDateTime } from "../../utils/formatDate";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const toForm = (s) => ({
  shippingCost: String(s.shipping.cost),
  freeThreshold: String(s.shipping.freeThreshold),
  lowStock: String(s.inventory.lowStockThreshold),
  name: s.store.name,
  manager: s.store.manager ?? "",
  phone: s.store.phone ?? "",
  address: s.store.address ?? "",
});

// کلید خطای سرور ← کلید فیلد فرم
const SERVER_KEYS = {
  "shipping.cost": "shippingCost",
  "shipping.freeThreshold": "freeThreshold",
  "inventory.lowStockThreshold": "lowStock",
  "store.name": "name",
  "store.manager": "manager",
  "store.phone": "phone",
  "store.address": "address",
};

const validate = (form) => {
  const errors = {};
  const whole = (key, label, max) => {
    const n = toNumber(form[key]);
    if (Number.isNaN(n))
      errors[key] =
        `${label} را به‌صورت عدد صحیح (و بدون علامت منفی) وارد کنید`;
    else if (n > max) errors[key] = `${label} بیش از حد مجاز است`;
  };

  whole("shippingCost", "هزینه‌ی ارسال", 10_000_000);
  whole("freeThreshold", "حداقل خرید برای ارسال رایگان", 1_000_000_000);
  whole("lowStock", "آستانه‌ی کم‌موجودی", 10_000);

  const name = form.name.trim();
  if (name.length < 2) errors.name = "نام فروشگاه باید حداقل ۲ کاراکتر باشد";
  else if (name.length > 60) errors.name = "نام فروشگاه خیلی طولانی است";

  if (form.manager.trim().length > 60)
    errors.manager = "نام مدیر خیلی طولانی است";
  if (!/^[0-9+\-\s()]*$/.test(form.phone.trim()))
    errors.phone = "تلفن فقط می‌تواند شامل عدد، + و - باشد";
  else if (form.phone.trim().length > 20)
    errors.phone = "شماره تلفن خیلی طولانی است";
  if (form.address.trim().length > 200) errors.address = "آدرس خیلی طولانی است";

  return errors;
};

const toPayload = (form) => ({
  shipping: {
    cost: toNumber(form.shippingCost),
    freeThreshold: toNumber(form.freeThreshold),
  },
  inventory: { lowStockThreshold: toNumber(form.lowStock) },
  store: {
    name: form.name.trim(),
    manager: form.manager.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
  },
});

const Hint = ({ children }) => (
  <p className="-mt-2 mb-4 text-[11px] leading-5 text-muted">{children}</p>
);

const RecentChanges = () => {
  const query = useAuditLogs({ entityType: "settings", limit: 5 });
  const logs = query.data?.data ?? [];

  return (
    <Card title="آخرین تغییرات">
      {query.isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-well" />
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted">هنوز تغییری ثبت نشده است.</p>
      ) : (
        <ul className="divide-y divide-line">
          {logs.map((log) => (
            <li key={log._id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm leading-6 text-paper">{log.summary}</p>
              <p className="mt-1 text-[11px] text-muted">
                {log.actorLabel || "ادمین"} ، {formatDateTime(log.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/admin/activity?entityType=settings"
        className="mt-4 inline-block text-xs text-bronze hover:opacity-80"
      >
        مشاهده‌ی همه‌ی تغییرات
      </Link>
    </Card>
  );
};

const SettingsForm = ({ settings }) => {
  const toast = useToast();
  const save = useSaveSettings();

  const initial = useMemo(() => toForm(settings), [settings]);
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedWarning(dirty);

  const clientErrors = useMemo(
    () => (submitted ? validate(form) : {}),
    [form, submitted],
  );
  const errors = { ...serverErrors, ...clientErrors };

  const set = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setServerErrors({});
    setServerMessage("");
  };

  const handleSave = () => {
    setSubmitted(true);
    if (Object.keys(validate(form)).length > 0) {
      toast.error("چند فیلد نیاز به اصلاح دارند");
      return;
    }

    save.mutate(toPayload(form), {
      onSuccess: () => toast.success("تنظیمات ذخیره شد"),
      onError: (err) => {
        const mapped = {};
        for (const [key, message] of Object.entries(
          err?.response?.data?.errors ?? {},
        )) {
          mapped[SERVER_KEYS[key] ?? key] = message;
        }
        setServerErrors(mapped);
        setServerMessage(parseApiError(err).message);
      },
    });
  };

  const cost = toNumber(form.shippingCost);
  const threshold = toNumber(form.freeThreshold);

  const shippingSummary = Number.isNaN(cost)
    ? ""
    : cost === 0
      ? "ارسال برای همه‌ی سفارش‌ها رایگان است."
      : Number.isNaN(threshold) || threshold === 0
        ? `هزینه‌ی ارسال ${formatToman(cost)} است و ارسال رایگان غیرفعال است.`
        : `هزینه‌ی ارسال ${formatToman(cost)}؛ سفارش‌های با جمع کالای ${formatToman(threshold)} یا بیشتر ارسال رایگان دارند.`;

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card
            icon={Truck}
            title="ارسال"
            hint="روی سفارش‌های جدید اعمال می‌شود؛ سفارش‌های ثبت‌شده مبلغ قبلی خودشان را نگه می‌دارند."
          >
            <Field
              label="هزینه‌ی ارسال (تومان)"
              dir="ltr"
              inputMode="numeric"
              value={form.shippingCost}
              error={errors.shippingCost}
              onChange={(e) => set({ shippingCost: e.target.value })}
            />
            <Field
              label="حداقل خرید برای ارسال رایگان (تومان)"
              dir="ltr"
              inputMode="numeric"
              value={form.freeThreshold}
              error={errors.freeThreshold}
              onChange={(e) => set({ freeThreshold: e.target.value })}
            />
            <Hint>
              عدد ۰ یعنی ارسال رایگان غیرفعال. مبلغ روی جمع کالاها (بعد از تخفیف
              محصول) سنجیده می‌شود.
            </Hint>
            {shippingSummary && (
              <p className="rounded-lg border border-line bg-ink/40 px-3.5 py-3 text-xs leading-6 text-muted">
                {shippingSummary}
              </p>
            )}
          </Card>

          <Card icon={Package} title="موجودی">
            <Field
              label="آستانه‌ی کم‌موجودی (عدد)"
              dir="ltr"
              inputMode="numeric"
              value={form.lowStock}
              error={errors.lowStock}
              onChange={(e) => set({ lowStock: e.target.value })}
            />
            <Hint>
              واریانتی که موجودی‌اش از این عدد کمتر یا مساوی باشد، در هشدارهای
              داشبورد و تب «کم‌موجودی» محصولات دیده می‌شود.
            </Hint>
          </Card>

          <Card
            icon={Store}
            title="اطلاعات فروشگاه"
            hint="روی فاکتور و برگه‌ی بسته‌بندی چاپ می‌شود."
          >
            <Field
              label="نام فروشگاه"
              value={form.name}
              maxLength={60}
              error={errors.name}
              onChange={(e) => set({ name: e.target.value })}
            />
            <Field
              label="مدیر فروشگاه"
              value={form.manager}
              maxLength={60}
              error={errors.manager}
              onChange={(e) => set({ manager: e.target.value })}
            />
            <Field
              label="تلفن"
              dir="ltr"
              value={form.phone}
              maxLength={20}
              error={errors.phone}
              onChange={(e) => set({ phone: e.target.value })}
            />
            <TextAreaField
              label="آدرس"
              rows={2}
              value={form.address}
              maxLength={200}
              error={errors.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20">
          <Card title="پیش‌نمایش سربرگ فاکتور">
            <div className="rounded-lg bg-white p-4 text-neutral-900">
              <p className="font-display text-lg font-bold">
                {form.name.trim() || "نام فروشگاه"}
              </p>
              {form.manager.trim() && (
                <p className="mt-1 text-xs">مدیر: {form.manager.trim()}</p>
              )}
              {form.phone.trim() && (
                <p dir="ltr" className="mt-1 text-right text-xs">
                  {form.phone.trim()}
                </p>
              )}
              {form.address.trim() && (
                <p className="mt-1 text-xs">{form.address.trim()}</p>
              )}
            </div>
          </Card>

          <RecentChanges />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-ink/90 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {serverMessage ? (
              <FormError message={serverMessage} />
            ) : (
              <p className="text-xs text-muted">
                {dirty
                  ? "تغییرات ذخیره‌نشده دارید"
                  : "همه‌ی تغییرات ذخیره شده است"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setForm(initial)}
              disabled={!dirty || save.isPending}
            >
              بازگرداندن
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={save.isPending}
              disabled={!dirty}
            >
              ذخیره‌ی تنظیمات
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminSettingsPage = () => {
  const query = useAdminSettings();
  const settings = query.data;

  return (
    <>
      <PageHeader
        title="تنظیمات فروشگاه"
        description={
          settings
            ? settings.updatedBy
              ? `آخرین ویرایش: ${formatDateTime(settings.updatedAt)} توسط ${settings.updatedBy.name || settings.updatedBy.phone}`
              : "هنوز ویرایش نشده؛ مقدارهای پیش‌فرض نمایش داده می‌شود"
            : undefined
        }
      />

      {query.isLoading ? (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : !settings ? (
        <ErrorState
          message="دریافت تنظیمات با خطا مواجه شد"
          onRetry={query.refetch}
        />
      ) : (
        // بعد از هر ذخیره updatedAt عوض می‌شه و فرم با مقدارهای جدید دوباره ساخته می‌شه
        <SettingsForm key={settings.updatedAt} settings={settings} />
      )}
    </>
  );
};

export default AdminSettingsPage;
