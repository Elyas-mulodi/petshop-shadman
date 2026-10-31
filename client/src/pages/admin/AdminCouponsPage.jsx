import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Switch from "../../components/admin/ui/Switch";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import CouponFormModal from "../../components/admin/coupons/CouponFormModal";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { useListParams } from "../../hooks/useListParams";
import {
  useAdminCoupons,
  useCouponCounts,
  useDeleteCoupon,
  useSaveCoupon,
} from "../../features/admin/coupons/useAdminCoupons";
import { formatToman } from "../../utils/price";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";
import { formatDayLong, toTehranDay } from "../../utils/tehranDate";

const DEFAULTS = { page: 1, limit: 20, search: "", status: "" };
const LIMITS = [20, 50, 100];

const STATUS_META = {
  active: { label: "فعال", tone: "success" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "warning" },
  expired: { label: "منقضی", tone: "neutral" },
  exhausted: { label: "تکمیل ظرفیت", tone: "warning" },
  disabled: { label: "غیرفعال", tone: "neutral" },
};

const TABS = [{ id: "", label: "همه", count: "all" }, ...Object.entries(STATUS_META).map(([id, m]) => ({ id, label: m.label, count: id }))];

const dayText = (iso) => formatDayLong(toTehranDay(new Date(iso)));

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`کپی کد ${text}`}
      title="کپی کد"
      className="text-muted transition-colors hover:text-paper"
    >
      {copied ? <Check className="h-4 w-4 text-sage" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

const AdminCouponsPage = () => {
  const toast = useToast();
  const { params, setParams } = useListParams(DEFAULTS);

  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;
  const status = STATUS_META[params.status] ? params.status : "";
  const { search } = params;

  const query = useMemo(
    () => ({ page: params.page, limit, ...(search && { search }), ...(status && { status }) }),
    [params.page, limit, search, status],
  );

  const coupons = useAdminCoupons(query);
  const counts = useCouponCounts();
  const save = useSaveCoupon();
  const remove = useDeleteCoupon();

  const rows = coupons.data?.data ?? [];
  const serverPagination = coupons.data?.pagination;

  const [form, setForm] = useState({ open: false, coupon: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    if (serverPagination && serverPagination.pages > 0 && params.page > serverPagination.pages) {
      setParams({ page: serverPagination.pages });
    }
  }, [serverPagination, params.page, setParams]);

  const toggleActive = (coupon, value) => {
    setPendingId(coupon._id);
    save.mutate(
      { id: coupon._id, body: { isActive: value } },
      {
        onSuccess: () => toast.success(value ? "کد فعال شد" : "کد غیرفعال شد"),
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setPendingId(null),
      },
    );
  };

  const handleDelete = () =>
    remove.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success("کد تخفیف حذف شد");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
        setDeleteTarget(null);
      },
    });

  const filtersActive = !!(status || search);

  const columns = [
    {
      key: "code",
      header: "کد",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span dir="ltr" className="font-medium text-paper">
            {c.code}
          </span>
          <span onClick={(e) => e.stopPropagation()}>
            <CopyButton text={c.code} />
          </span>
        </div>
      ),
    },
    {
      key: "discount",
      header: "تخفیف",
      cell: (c) =>
        c.discountType === "percentage" ? (
          <div>
            <p className="text-bronze">{toPersianDigits(c.discountValue)}٪</p>
            {c.maxDiscountAmount && <p className="text-[11px] text-muted">تا سقف {formatToman(c.maxDiscountAmount)}</p>}
          </div>
        ) : (
          <p className="text-bronze">{formatToman(c.discountValue)}</p>
        ),
    },
    {
      key: "minCart",
      header: "حداقل سبد",
      hideBelow: "lg",
      cell: (c) => <span className="text-muted">{c.minCartAmount > 0 ? formatToman(c.minCartAmount) : "—"}</span>,
    },
    {
      key: "validity",
      header: "اعتبار",
      hideBelow: "xl",
      cell: (c) =>
        c.startsAt || c.expiresAt ? (
          <div className="text-xs text-muted">
            {c.startsAt && <p>از {dayText(c.startsAt)}</p>}
            {c.expiresAt && <p>تا {dayText(c.expiresAt)}</p>}
          </div>
        ) : (
          <span className="text-xs text-muted">بدون محدودیت زمانی</span>
        ),
    },
    {
      key: "usage",
      header: "استفاده",
      cell: (c) => (
        <div className="min-w-[96px]">
          <p className="text-paper">
            {toPersianDigits(c.usedCount)}
            {c.usageLimit ? ` از ${toPersianDigits(c.usageLimit)}` : " بار"}
          </p>
          {c.usageLimit && (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-well">
              <div
                className={`h-full rounded-full ${c.usedCount >= c.usageLimit ? "bg-danger" : "bg-bronze"}`}
                style={{ width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%` }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "performance",
      header: "عملکرد",
      hideBelow: "xl",
      cell: (c) =>
        c.stats.orders === 0 ? (
          <span className="text-muted/60">—</span>
        ) : (
          <div className="text-xs">
            <p className="text-paper">{toPersianDigits(c.stats.orders)} سفارش</p>
            <p className="text-muted">تخفیف {formatToman(c.stats.discount)}</p>
          </div>
        ),
    },
    {
      key: "status",
      header: "وضعیت",
      cell: (c) => <Badge tone={STATUS_META[c.status].tone}>{STATUS_META[c.status].label}</Badge>,
    },
    {
      key: "active",
      header: "فعال",
      stopRowClick: true,
      cell: (c) => (
        <Switch
          checked={c.isActive}
          disabled={pendingId === c._id}
          label={c.isActive ? `غیرفعال کردن ${c.code}` : `فعال کردن ${c.code}`}
          onChange={(value) => toggleActive(c, value)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      stopRowClick: true,
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="ویرایش"
            aria-label={`ویرایش ${c.code}`}
            onClick={() => setForm({ open: true, coupon: c })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="حذف"
            aria-label={`حذف ${c.code}`}
            className="hover:text-danger"
            onClick={() => setDeleteTarget(c)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="کدهای تخفیف"
        description={serverPagination ? `${toPersianDigits(serverPagination.total)} کد` : "مدیریت کدهای تخفیف"}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, coupon: null })}>
            کد جدید
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="وضعیت کد"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const active = tab.id === status;
          const count = counts.data?.[tab.count];
          return (
            <button
              key={tab.id || "all"}
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ status: tab.id })}
              className={`relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm transition-colors ${
                active ? "text-paper" : "text-muted hover:text-paper"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-xs ${active ? "text-bronze" : "text-muted/70"}`}>{toPersianDigits(count)}</span>
              )}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-bronze" />}
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => setParams({ search: value })}
          placeholder="جستجوی کد تخفیف..."
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={coupons.isLoading}
        fetching={coupons.isFetching && !coupons.isLoading}
        error={coupons.error}
        onRetry={coupons.refetch}
        onRowClick={(c) => setForm({ open: true, coupon: c })}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: filtersActive ? "کدی پیدا نشد" : "هنوز کد تخفیفی ساخته نشده است",
          message: filtersActive ? "فیلتر یا عبارت جستجو را تغییر دهید." : "برای جذب مشتری، اولین کد تخفیف را بسازید.",
          action: !filtersActive ? (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setForm({ open: true, coupon: null })}>
              کد جدید
            </Button>
          ) : undefined,
        }}
      />

      <CouponFormModal
        open={form.open}
        coupon={form.coupon}
        onClose={() => setForm((prev) => ({ ...prev, open: false }))}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف کد تخفیف؟"
        message={
          deleteTarget
            ? deleteTarget.usedCount > 0
              ? `«${deleteTarget.code}» قبلاً ${toPersianDigits(deleteTarget.usedCount)} بار استفاده شده و حذف نمی‌شود. به‌جای حذف، آن را غیرفعال کنید.`
              : `«${deleteTarget.code}» حذف می‌شود.`
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

export default AdminCouponsPage;