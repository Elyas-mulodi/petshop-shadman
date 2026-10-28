import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Download, PawPrint, Printer, RefreshCw } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Checkbox from "../../components/admin/ui/Checkbox";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import { useToast } from "../../components/admin/ui/ToastProvider";
import StatusBadge from "../../components/orders/StatusBadge";
import { useListParams } from "../../hooks/useListParams";
import {
  downloadOrdersCsv,
  readBlobError,
  useAdminOrders,
  useBulkProcessing,
  useOrderCounts,
} from "../../features/admin/orders/useAdminOrders";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { formatDate } from "../../utils/formatDate";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";
import { addDays, formatDayLong, isDay, todayTehran } from "../../utils/tehranDate";

const DEFAULTS = { page: 1, limit: 20, status: "", search: "", from: "", to: "", sort: "newest", flag: "" };
const LIMITS = [20, 50, 100];
const MAX_PRINT = 30;

const TABS = [
  { id: "", label: "همه" },
  { id: "pending_payment", label: "در انتظار پرداخت" },
  { id: "paid", label: "پرداخت‌شده" },
  { id: "processing", label: "آماده‌سازی" },
  { id: "shipped", label: "ارسال‌شده" },
  { id: "delivered", label: "تحویل‌شده" },
  { id: "cancelled", label: "لغو شده" },
  { id: "returned", label: "مرجوع" },
  { id: "expired", label: "منقضی" },
];

const FLAGS = [
  { id: "stockIssue", label: "کمبود موجودی" },
  { id: "refundPending", label: "عودت وجه در انتظار" },
];

const QUICK_RANGES = [
  { id: "today", label: "امروز", days: 1 },
  { id: "7", label: "۷ روز اخیر", days: 7 },
  { id: "30", label: "۳۰ روز اخیر", days: 30 },
];

const SORT_TO_TABLE = {
  newest: { key: "createdAt", dir: "desc" },
  oldest: { key: "createdAt", dir: "asc" },
  totalDesc: { key: "totalAmount", dir: "desc" },
  totalAsc: { key: "totalAmount", dir: "asc" },
};

const fromTableSort = ({ key, dir }) =>
  key === "createdAt" ? (dir === "asc" ? "oldest" : "newest") : dir === "asc" ? "totalAsc" : "totalDesc";

const timeFormat = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

const Thumbs = ({ items }) => {
  const quantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {items.slice(0, 3).map((item, i) => {
          const image = getImageUrl(item.image);
          return image ? (
            <img
              key={i}
              src={image}
              alt=""
              loading="lazy"
              className="-mr-2 h-8 w-8 rounded-md object-cover ring-2 ring-card first:mr-0"
            />
          ) : (
            <span
              key={i}
              className="-mr-2 flex h-8 w-8 items-center justify-center rounded-md bg-well ring-2 ring-card first:mr-0"
            >
              <PawPrint className="h-4 w-4 text-sage" strokeWidth={1.4} />
            </span>
          );
        })}
      </div>
      <span className="text-xs text-muted">{toPersianDigits(quantity)} عدد</span>
    </div>
  );
};

const dateInput =
  "rounded-lg border border-line bg-card px-3 py-2 text-xs text-paper [color-scheme:dark] focus:border-bronze focus:outline-none";

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { params, setParams } = useListParams(DEFAULTS);

  // مقدارهای URL قبل از استفاده اعتبارسنجی می‌شن
  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;
  const status = TABS.some((t) => t.id === params.status) ? params.status : "";
  const sort = SORT_TO_TABLE[params.sort] ? params.sort : "newest";
  const flag = FLAGS.some((f) => f.id === params.flag) ? params.flag : "";
  const from = isDay(params.from) ? params.from : "";
  const to = isDay(params.to) ? params.to : "";
  const { search } = params;

  const filterQuery = useMemo(
    () => ({
      ...(search && { search }),
      ...(from && { from }),
      ...(to && { to }),
      ...(flag === "stockIssue" && { stockIssue: "true" }),
      ...(flag === "refundPending" && { refundPending: "true" }),
    }),
    [search, from, to, flag],
  );

  const exportQuery = useMemo(
    () => ({ ...filterQuery, ...(status && { status }), ...(sort !== "newest" && { sort }) }),
    [filterQuery, status, sort],
  );

  const listQuery = useMemo(() => ({ ...exportQuery, page: params.page, limit }), [exportQuery, params.page, limit]);

  const orders = useAdminOrders(listQuery);
  const counts = useOrderCounts(filterQuery);
  const bulk = useBulkProcessing();

  const rows = orders.data?.data ?? [];
  const serverPagination = orders.data?.pagination;
  const countData = counts.data;

  const [selected, setSelected] = useState(() => new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [exporting, setExporting] = useState(false);

  // با عوض‌شدن فیلتر، صفحه یا مرتب‌سازی، انتخاب پاک می‌شه
  const selectionScope = JSON.stringify(listQuery);
  useEffect(() => {
    setSelected(new Set());
  }, [selectionScope]);

  useEffect(() => {
    if (serverPagination && serverPagination.pages > 0 && params.page > serverPagination.pages) {
      setParams({ page: serverPagination.pages });
    }
  }, [serverPagination, params.page, setParams]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r._id));
  const someSelected = rows.some((r) => selected.has(r._id));
  const eligibleForProcessing = rows.filter((r) => selected.has(r._id) && r.status === "paid").length;

  const toggleAll = (checked) => setSelected(checked ? new Set(rows.map((r) => r._id)) : new Set());
  const toggleOne = (id, checked) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const filtersActive = !!(status || search || from || to || flag);
  const resetFilters = () => setParams({ status: "", search: "", from: "", to: "", flag: "" });

  const applyQuick = (days) => {
    const end = todayTehran();
    setParams({ from: addDays(end, -(days - 1)), to: end });
  };

  const quickActive = (days) => from === addDays(todayTehran(), -(days - 1)) && to === todayTehran();

  const openPrint = (type) => {
    if (selected.size > MAX_PRINT) {
      toast.error(`برای چاپ حداکثر ${toPersianDigits(MAX_PRINT)} سفارش را انتخاب کنید`);
      return;
    }
    window.open(`/admin/print?type=${type}&ids=${[...selected].join(",")}`, "_blank", "noopener,noreferrer");
  };

  const handleBulk = () =>
    bulk.mutate([...selected], {
      onSuccess: (result) => {
        toast.success(
          `${toPersianDigits(result.updated)} سفارش به «در حال آماده‌سازی» رفت` +
            (result.skipped ? ` (${toPersianDigits(result.skipped)} سفارش مجاز نبود)` : ""),
        );
        setSelected(new Set());
        setConfirmBulk(false);
      },
      onError: (err) => toast.error(parseApiError(err).message),
    });

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadOrdersCsv(exportQuery);
      toast.success("فایل خروجی آماده شد");
    } catch (err) {
      toast.error(await readBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "select",
      width: 44,
      stopRowClick: true,
      header: (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={toggleAll}
          label="انتخاب همه‌ی سفارش‌های این صفحه"
        />
      ),
      cell: (order) => (
        <Checkbox
          checked={selected.has(order._id)}
          onChange={(checked) => toggleOne(order._id, checked)}
          label={`انتخاب سفارش ${order.orderNumber}`}
        />
      ),
    },
    {
      key: "orderNumber",
      header: "سفارش",
      cell: (order) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span dir="ltr" className="font-medium text-paper">
            {order.orderNumber}
          </span>
          {order.stockIssue && ["paid", "processing"].includes(order.status) && (
            <span title="کمبود موجودی">
              <AlertTriangle className="h-3.5 w-3.5 text-danger" />
            </span>
          )}
          {order.refund?.required && !order.refund.doneAt && <Badge tone="danger">عودت</Badge>}
        </div>
      ),
    },
    {
      key: "customer",
      header: "گیرنده",
      cell: (order) => (
        <div className="min-w-0">
          <p className="truncate text-paper">{order.shippingAddress?.fullName || order.user?.name || "—"}</p>
          <p dir="ltr" className="text-right text-xs text-muted">
            {order.shippingAddress?.phone || order.user?.phone}
          </p>
        </div>
      ),
    },
    { key: "items", header: "اقلام", hideBelow: "lg", cell: (order) => <Thumbs items={order.items} /> },
    { key: "province", header: "استان", hideBelow: "xl", cell: (order) => <span className="text-muted">{order.shippingAddress?.province}</span> },
    {
      key: "createdAt",
      header: "تاریخ ثبت",
      sortKey: "createdAt",
      hideBelow: "md",
      cell: (order) => (
        <div>
          <p className="text-paper">{formatDate(order.createdAt)}</p>
          <p className="text-xs text-muted">{timeFormat.format(new Date(order.createdAt))}</p>
        </div>
      ),
    },
    { key: "status", header: "وضعیت", cell: (order) => <StatusBadge status={order.status} /> },
    {
      key: "totalAmount",
      header: "مبلغ کل",
      sortKey: "totalAmount",
      align: "end",
      cell: (order) => <span className="text-bronze">{formatToman(order.totalAmount)}</span>,
    },
  ];

  const description = [
    serverPagination ? `${toPersianDigits(serverPagination.total)} سفارش` : "مدیریت سفارش‌ها",
    from && to ? `از ${formatDayLong(from)} تا ${formatDayLong(to)}` : null,
  ]
    .filter(Boolean)
    .join(" ، ");

  return (
    <>
      <PageHeader
        title="سفارش‌ها"
        description={description}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={handleExport} loading={exporting}>
              خروجی CSV
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="تازه‌سازی"
              title="تازه‌سازی"
              disabled={orders.isFetching}
              onClick={() => {
                orders.refetch();
                counts.refetch();
              }}
            >
              <RefreshCw className={`h-4 w-4 ${orders.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </>
        }
      />

      {/* تب‌های وضعیت */}
      <div
        role="tablist"
        aria-label="وضعیت سفارش"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const selectedTab = tab.id === status;
          const count = tab.id === "" ? countData?.all : countData?.byStatus?.[tab.id] ?? 0;
          return (
            <button
              key={tab.id || "all"}
              role="tab"
              aria-selected={selectedTab}
              onClick={() => setParams({ status: tab.id })}
              className={`relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm transition-colors ${
                selectedTab ? "text-paper" : "text-muted hover:text-paper"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className={`text-xs ${selectedTab ? "text-bronze" : "text-muted/70"}`}>
                  {toPersianDigits(count)}
                </span>
              )}
              {selectedTab && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-bronze" />}
            </button>
          );
        })}
      </div>

      {/* فیلترها */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(value) => setParams({ search: value })}
          placeholder="شماره سفارش، نام، موبایل، کد رهگیری..."
          className="w-full max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          {QUICK_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => applyQuick(range.days)}
              aria-pressed={quickActive(range.days)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                quickActive(range.days)
                  ? "border-bronze/60 bg-bronze/10 text-bronze"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              {range.label}
            </button>
          ))}

          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setParams({ from: e.target.value })}
            aria-label="از تاریخ"
            className={dateInput}
          />
          <span className="text-xs text-muted">تا</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setParams({ to: e.target.value })}
            aria-label="تا تاریخ"
            className={dateInput}
          />
        </div>

        {FLAGS.map((f) => {
          const active = flag === f.id;
          const count = countData?.[f.id] ?? 0;
          return (
            <button
              key={f.id}
              onClick={() => setParams({ flag: active ? "" : f.id })}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-danger/60 bg-danger/10 text-danger"
                  : count > 0
                    ? "border-danger/40 text-danger hover:bg-danger/10"
                    : "border-line text-muted hover:text-paper"
              }`}
            >
              {f.label} {toPersianDigits(count)}
            </button>
          );
        })}

        {filtersActive && (
          <button onClick={resetFilters} className="text-xs text-bronze transition-opacity hover:opacity-80">
            حذف همه‌ی فیلترها
          </button>
        )}
      </div>

      {/* نوار عملیات گروهی */}
      {selected.size > 0 && (
        <div
          role="region"
          aria-label="عملیات گروهی"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bronze/40 bg-bronze/5 px-4 py-3"
        >
          <p className="text-sm text-paper">{toPersianDigits(selected.size)} سفارش انتخاب شده</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={eligibleForProcessing === 0}
              onClick={() => setConfirmBulk(true)}
            >
              شروع آماده‌سازی ({toPersianDigits(eligibleForProcessing)})
            </Button>
            <Button size="sm" icon={Printer} onClick={() => openPrint("packing")}>
              برگه‌ی بسته‌بندی
            </Button>
            <Button size="sm" icon={Printer} onClick={() => openPrint("invoice")}>
              فاکتور
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              لغو انتخاب
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={orders.isLoading}
        fetching={orders.isFetching && !orders.isLoading}
        error={orders.error}
        onRetry={orders.refetch}
        sort={SORT_TO_TABLE[sort]}
        onSortChange={(next) => setParams({ sort: fromTableSort(next) })}
        onRowClick={(order) => navigate(`/admin/orders/${order._id}`)}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: "سفارشی پیدا نشد",
          message: filtersActive ? "فیلترها را تغییر دهید یا حذف کنید." : "هنوز سفارشی ثبت نشده است.",
          action: filtersActive ? (
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              حذف فیلترها
            </Button>
          ) : undefined,
        }}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="شروع آماده‌سازی؟"
        message={`وضعیت ${toPersianDigits(eligibleForProcessing)} سفارش پرداخت‌شده به «در حال آماده‌سازی» تغییر می‌کند. سفارش‌های انتخابی با وضعیت دیگر دست‌نخورده می‌مانند.`}
        confirmLabel="شروع آماده‌سازی"
        tone="primary"
        loading={bulk.isPending}
        onConfirm={handleBulk}
        onClose={() => setConfirmBulk(false)}
      />
    </>
  );
};

export default AdminOrdersPage;