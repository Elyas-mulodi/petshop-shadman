import { useMemo, useState } from "react";
import { Gift, Info, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Switch from "../../components/admin/ui/Switch";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import TierFormModal, {
  parsePercent,
} from "../../components/admin/loyalty/TierFormModal";
import ErrorState from "../../components/common/ErrorState";
import { Card } from "../../components/profile/ProfileParts";
import Input from "../../components/admin/ui/Input";
import { useToast } from "../../components/admin/ui/ToastProvider";
import {
  useDeleteTier,
  useLoyaltyTiers,
  useSaveTier,
} from "../../features/admin/loyalty/useLoyaltyTiers";
import { toNumber } from "../../features/admin/products/productForm";
import { LOYALTY_VALID_DAYS } from "../../utils/loyalty";
import { formatToman } from "../../utils/price";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const percentText = (value) => toPersianDigits(String(value).replace(".", "٫"));

const Simulator = ({ tiers }) => {
  const [value, setValue] = useState("");
  const amount = toNumber(value);
  const active = tiers.filter((t) => t.isActive);

  const current = Number.isNaN(amount)
    ? null
    : (active
        .filter((t) => t.minOrderAmount <= amount)
        .sort((a, b) => b.minOrderAmount - a.minOrderAmount)[0] ?? null);
  const next = Number.isNaN(amount)
    ? null
    : active.find((t) => t.minOrderAmount > amount);

  return (
    <Card
      title="شبیه‌ساز"
      hint="ببینید سفارشی با مبلغ مشخص، چه تخفیفی برای سفارش بعدی می‌گیرد."
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">
          جمع کالاهای سفارش (تومان)
        </span>
        <Input
          dir="ltr"
          inputMode="numeric"
          value={value}
          placeholder="مثلاً 800000"
          onChange={(e) => setValue(e.target.value)}
        />
      </label>

      {!Number.isNaN(amount) && (
        <div className="mt-4 space-y-1.5 text-sm">
          <p className="text-paper">
            {current ? (
              <>
                تخفیف سفارش بعدی:{" "}
                <span className="font-bold text-bronze">
                  {percentText(current.discountPercent)}٪
                </span>
              </>
            ) : (
              "این سفارش به هیچ پله‌ای نمی‌رسد."
            )}
          </p>
          {next && (
            <p className="text-xs leading-6 text-muted">
              با {formatToman(next.minOrderAmount - amount)} خرید بیشتر به پله‌ی{" "}
              {percentText(next.discountPercent)}٪ می‌رسد.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

const AdminLoyaltyPage = () => {
  const toast = useToast();
  const query = useLoyaltyTiers();
  const save = useSaveTier();
  const remove = useDeleteTier();

  const [form, setForm] = useState({ open: false, tier: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const tiers = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) => a.minOrderAmount - b.minOrderAmount,
      ),
    [query.data],
  );

  const warnings = useMemo(() => {
    const result = new Map();
    let best = null;

    for (const tier of tiers.filter((t) => t.isActive)) {
      if (best && tier.discountPercent <= best.discountPercent) {
        result.set(
          tier._id,
          `تخفیف این پله از پله‌ی ${formatToman(best.minOrderAmount)} (${percentText(best.discountPercent)}٪) بیشتر نیست.`,
        );
      }
      if (!best || tier.discountPercent > best.discountPercent) best = tier;
    }

    return result;
  }, [tiers]);

  const toggleActive = (tier, value) => {
    setPendingId(tier._id);
    save.mutate(
      { id: tier._id, body: { isActive: value } },
      {
        onSuccess: () =>
          toast.success(value ? "پله فعال شد" : "پله غیرفعال شد"),
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setPendingId(null),
      },
    );
  };

  const handleDelete = () =>
    remove.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success("پله حذف شد");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
        setDeleteTarget(null);
      },
    });

  return (
    <>
      <PageHeader
        title="باشگاه مشتریان"
        description="تخفیف پلکانی برای سفارش بعدی مشتری"
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setForm({ open: true, tier: null })}
          >
            پله‌ی جدید
          </Button>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-line bg-card px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
        <p className="text-xs leading-7 text-muted">
          بعد از هر پرداخت موفق، بالاترین پله‌ی فعالی که حداقل مبلغش از جمع
          کالاهای همان سفارش کمتر یا برابر است پیدا می‌شود و درصدش به‌عنوان
          تخفیف سفارش بعدی مشتری ثبت می‌شود. این تخفیف{" "}
          {toPersianDigits(LOYALTY_VALID_DAYS)} روز اعتبار دارد و هنگام ثبت
          سفارش خودکار اعمال می‌شود، مگر اینکه مشتری کد تخفیف وارد کند (در آن
          صورت فقط کد اعمال می‌شود). مبلغ هر پله روی جمع کالاها (بعد از تخفیف
          محصول و بدون هزینه‌ی ارسال) سنجیده می‌شود.
        </p>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : query.error && !query.data ? (
        <ErrorState
          message="دریافت پله‌ها با خطا مواجه شد"
          onRetry={query.refetch}
        />
      ) : tiers.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
          <Gift className="mb-4 h-10 w-10 text-sage" strokeWidth={1.3} />
          <p className="font-display text-base font-bold text-paper">
            هنوز پله‌ای تعریف نشده است
          </p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
            تا پله‌ای فعال نباشد، مشتری‌ها تخفیف وفاداری نمی‌گیرند.
          </p>
          <Button
            variant="primary"
            icon={Plus}
            className="mt-5"
            onClick={() => setForm({ open: true, tier: null })}
          >
            پله‌ی جدید
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1.7fr_1fr]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {tiers.map((tier) => {
              const warning = warnings.get(tier._id);
              return (
                <li
                  key={tier._id}
                  className={`rounded-2xl border bg-card p-5 ${tier.isActive ? "border-line" : "border-line opacity-70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-4xl font-bold text-bronze">
                        {percentText(tier.discountPercent)}٪
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        تخفیف سفارش بعدی
                      </p>
                    </div>
                    <Switch
                      checked={tier.isActive}
                      disabled={pendingId === tier._id}
                      label={
                        tier.isActive ? "غیرفعال کردن پله" : "فعال کردن پله"
                      }
                      onChange={(value) => toggleActive(tier, value)}
                    />
                  </div>

                  <p className="mt-4 border-t border-line pt-4 text-sm text-paper">
                    جمع کالاها از {formatToman(tier.minOrderAmount)} به بالا
                  </p>

                  {warning && (
                    <p className="mt-3 rounded-lg border border-bronze/40 bg-bronze/5 px-3 py-2 text-xs leading-6 text-muted">
                      {warning}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    {tier.isActive ? (
                      <Badge tone="success">فعال</Badge>
                    ) : (
                      <Badge>غیرفعال</Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="ویرایش"
                        aria-label="ویرایش پله"
                        onClick={() => setForm({ open: true, tier })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="حذف"
                        aria-label="حذف پله"
                        className="hover:text-danger"
                        onClick={() => setDeleteTarget(tier)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Simulator tiers={tiers} />
        </div>
      )}

      <TierFormModal
        open={form.open}
        tier={form.tier}
        onClose={() => setForm((prev) => ({ ...prev, open: false }))}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف پله؟"
        message={
          deleteTarget
            ? `پله‌ی ${percentText(deleteTarget.discountPercent)}٪ (از ${formatToman(deleteTarget.minOrderAmount)}) حذف می‌شود. تخفیف‌هایی که قبلاً به مشتری‌ها داده شده، تا پایان اعتبار می‌مانند.`
            : ""
        }
        confirmLabel="حذف شود"
        loading={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default AdminLoyaltyPage;
