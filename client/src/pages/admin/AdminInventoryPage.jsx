import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Download, PawPrint, RefreshCw } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import StockEditor from "../../components/admin/inventory/StockEditor";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { useListParams } from "../../hooks/useListParams";
import {
  downloadInventoryCsv,
  useInventoryList,
  useInventorySummary,
} from "../../features/admin/inventory/useInventory";
import { readBlobError } from "../../features/admin/orders/useAdminOrders";
import {
  useAdminBrands,
  useAdminCategories,
} from "../../features/admin/products/useAdminProducts";
import {
  buildCategoryTree,
  flattenTree,
} from "../../features/admin/products/categoryTree";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const DEFAULTS = {
  page: 1,
  limit: 30,
  search: "",
  status: "",
  active: "",
  category: "",
  brand: "",
  sort: "stockAsc",
};
const LIMITS = [30, 50, 100];

const TABS = [
  { id: "", label: "همه", count: "variants" },
  { id: "out", label: "ناموجود", count: "out" },
  { id: "low", label: "کم‌موجودی", count: "low" },
  { id: "negative", label: "موجودی منفی", count: "negative" },
  { id: "ok", label: "موجود", count: "ok" },
];

const SORTS = [
  { id: "stockAsc", label: "کمترین موجودی" },
  { id: "stockDesc", label: "بیشترین موجودی" },
  { id: "valueDesc", label: "بیشترین ارزش" },
  { id: "nameAsc", label: "نام محصول" },
];

const selectClass =
  "rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-paper focus:border-bronze focus:outline-none";

const StatCard = ({ label, value, hint, tone }) => (
  <div
    className={`rounded-2xl border p-4 ${
      tone === "alert" && value > 0
        ? "border-danger/40 bg-danger/5"
        : tone === "attention" && value > 0
          ? "border-bronze/40 bg-bronze/5"
          : "border-line bg-card"
    }`}
  >
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-2 font-display text-xl font-bold text-paper md:text-2xl">
      {typeof value === "number"
        ? toPersianDigits(value.toLocaleString("en-US"))
        : value}
    </p>
    {hint && <p className="mt-1.5 text-[11px] leading-5 text-muted">{hint}</p>}
  </div>
);

const StockBadge = ({ stock, threshold }) => {
  if (stock < 0) return <Badge tone="danger">منفی</Badge>;
  if (stock === 0) return <Badge tone="danger">ناموجود</Badge>;
  if (stock <= threshold) return <Badge tone="warning">کم‌موجودی</Badge>;
  return <Badge tone="success">موجود</Badge>;
};

const AdminInventoryPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { params, setParams } = useListParams(DEFAULTS);

  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;
  const status = TABS.some((t) => t.id === params.status) ? params.status : "";
  const sort = SORTS.some((s) => s.id === params.sort)
    ? params.sort
    : "stockAsc";
  const active = ["true", "false"].includes(params.active) ? params.active : "";
  const { search, category, brand } = params;

  // خروجی و لیست فیلتر مشترک دارن؛ لیست صفحه‌بندی هم داره
  const filters = useMemo(
    () => ({
      ...(search && { search }),
      ...(status && { status }),
      ...(active && { active }),
      ...(category && { category }),
      ...(brand && { brand }),
      ...(sort !== "stockAsc" && { sort }),
    }),
    [search, status, active, category, brand, sort],
  );
  const listQuery = useMemo(
    () => ({ ...filters, page: params.page, limit }),
    [filters, params.page, limit],
  );

  const list = useInventoryList(listQuery);
  const summary = useInventorySummary();
  const categories = useAdminCategories();
  const brands = useAdminBrands();

  const rows = list.data?.data ?? [];
  const serverPagination = list.data?.pagination;
  const threshold = list.data?.threshold ?? summary.data?.threshold ?? 5;
  const s = summary.data;

  const categoryOptions = useMemo(
    () => flattenTree(buildCategoryTree(categories.data ?? [])),
    [categories.data],
  );
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (
      serverPagination &&
      serverPagination.pages > 0 &&
      params.page > serverPagination.pages
    ) {
      setParams({ page: serverPagination.pages });
    }
  }, [serverPagination, params.page, setParams]);

  const filtersActive = !!(search || status || active || category || brand);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadInventoryCsv(filters);
      toast.success("فایل انبارگردانی آماده شد");
    } catch (err) {
      toast.error(await readBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "product",
      header: "محصول",
      cell: (r) => {
        const image = getImageUrl(r.image);
        return (
          <div className="flex items-center gap-3">
            {image ? (
              <img
                src={image}
                alt=""
                loading="lazy"
                className="h-11 w-11 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-well">
                <PawPrint className="h-4 w-4 text-sage" strokeWidth={1.4} />
              </span>
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-paper">
                <span className="truncate">{r.name}</span>
                {!r.isActive && <Badge>غیرفعال</Badge>}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {r.attributes.map((a) => `${a.name}: ${a.value}`).join("، ")}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "sku",
      header: "SKU",
      hideBelow: "xl",
      cell: (r) => (
        <span dir="ltr" className="text-xs text-muted">
          {r.sku ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "قیمت",
      hideBelow: "lg",
      cell: (r) => <span className="text-muted">{formatToman(r.price)}</span>,
    },
    {
      key: "stock",
      header: "موجودی",
      stopRowClick: true,
      cell: (r) => (
        // با عوض‌شدن موجودی روی سرور، مقدار ورودی دوباره از سرور خونده می‌شه
        <StockEditor key={`${r.variantId}-${r.stock}`} row={r} />
      ),
    },
    {
      key: "value",
      header: "ارزش",
      hideBelow: "md",
      cell: (r) => (
        <span className={r.value > 0 ? "text-bronze" : "text-muted/60"}>
          {r.value > 0 ? formatToman(r.value) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      cell: (r) => <StockBadge stock={r.stock} threshold={threshold} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="موجودی انبار"
        description={
          serverPagination
            ? `${toPersianDigits(serverPagination.total)} واریانت`
            : "مدیریت موجودی همه‌ی واریانت‌ها"
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExport}
              loading={exporting}
            >
              خروجی انبارگردانی
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="تازه‌سازی"
              title="تازه‌سازی"
              disabled={list.isFetching}
              onClick={() => {
                list.refetch();
                summary.refetch();
              }}
            >
              <RefreshCw
                className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </>
        }
      />

      {s && s.negative > 0 && (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm leading-7 text-paper">
              {toPersianDigits(s.negative)} واریانت موجودی منفی دارند، یعنی بعد
              از پرداخت مشتری، کالایی بیشتر از موجودی فروش رفته است.
              {s.stockIssueOrders > 0 && (
                <>
                  {" "}
                  {toPersianDigits(s.stockIssueOrders)} سفارش هنوز منتظر رسیدگی
                  است.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setParams({ status: "negative" })}
              className="text-bronze hover:opacity-80"
            >
              مشاهده‌ی واریانت‌ها
            </button>
            {s.stockIssueOrders > 0 && (
              <Link
                to="/admin/orders?flag=stockIssue"
                className="text-bronze hover:opacity-80"
              >
                سفارش‌های دارای کمبود
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summary.isLoading || !s ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
          ))
        ) : (
          <>
            <StatCard
              label="ارزش کل انبار"
              value={formatToman(s.value)}
              hint="به قیمت فروش و قبل از تخفیف محصول"
            />
            <StatCard
              label="مجموع واحدهای موجود"
              value={s.units}
              hint={`${toPersianDigits(s.variants)} واریانت`}
            />
            <StatCard
              label="ناموجود"
              value={s.out}
              tone="alert"
              hint="موجودی صفر یا منفی"
            />
            <StatCard
              label="کم‌موجودی"
              value={s.low}
              tone="attention"
              hint={`${toPersianDigits(s.threshold)} عدد یا کمتر (از تنظیمات فروشگاه)`}
            />
          </>
        )}
      </div>

      <div
        role="tablist"
        aria-label="وضعیت موجودی"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === status;
          const count = s?.[tab.count];
          return (
            <button
              key={tab.id || "all"}
              role="tab"
              aria-selected={isActive}
              onClick={() => setParams({ status: tab.id })}
              className={`relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm transition-colors ${
                isActive ? "text-paper" : "text-muted hover:text-paper"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span
                  className={`text-xs ${isActive ? "text-bronze" : "text-muted/70"}`}
                >
                  {toPersianDigits(count)}
                </span>
              )}
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-bronze" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(value) => setParams({ search: value })}
          placeholder="نام محصول یا SKU..."
          className="w-full max-w-xs"
        />

        <select
          value={category}
          onChange={(e) => setParams({ category: e.target.value })}
          aria-label="دسته‌بندی"
          className={selectClass}
        >
          <option value="">همه‌ی دسته‌بندی‌ها</option>
          {categoryOptions.map((c) => (
            <option key={c._id} value={c._id}>
              {`${"— ".repeat(c.depth)}${c.name}`}
            </option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(e) => setParams({ brand: e.target.value })}
          aria-label="برند"
          className={selectClass}
        >
          <option value="">همه‌ی برندها</option>
          {(brands.data ?? []).map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={active}
          onChange={(e) => setParams({ active: e.target.value })}
          aria-label="وضعیت محصول"
          className={selectClass}
        >
          <option value="">فعال و غیرفعال</option>
          <option value="true">فقط محصولات فعال</option>
          <option value="false">فقط محصولات غیرفعال</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setParams({ sort: e.target.value })}
          aria-label="مرتب‌سازی"
          className={selectClass}
        >
          {SORTS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            onClick={() =>
              setParams({
                search: "",
                status: "",
                active: "",
                category: "",
                brand: "",
              })
            }
            className="text-xs text-bronze transition-opacity hover:opacity-80"
          >
            حذف فیلترها
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey="variantId"
        loading={list.isLoading}
        fetching={list.isFetching && !list.isLoading}
        error={list.error}
        onRetry={list.refetch}
        onRowClick={(r) => navigate(`/admin/products/${r.productId}`)}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: filtersActive
            ? "واریانتی پیدا نشد"
            : "هنوز محصولی ثبت نشده است",
          message: filtersActive
            ? "فیلترها را تغییر دهید یا حذف کنید."
            : undefined,
        }}
      />
    </>
  );
};

export default AdminInventoryPage;
