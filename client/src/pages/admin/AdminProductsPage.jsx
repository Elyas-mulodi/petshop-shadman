import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, PawPrint, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Checkbox from "../../components/admin/ui/Checkbox";
import Switch from "../../components/admin/ui/Switch";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import StockDrawer from "../../components/admin/products/StockDrawer";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { useListParams } from "../../hooks/useListParams";
import {
  useAdminBrands,
  useAdminCategories,
  useAdminProducts,
  useBulkSetActive,
  useDeleteProduct,
  useDuplicateProduct,
  useProductCounts,
} from "../../features/admin/products/useAdminProducts";
import { buildCategoryTree, flattenTree } from "../../features/admin/products/categoryTree";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const DEFAULTS = { page: 1, limit: 20, search: "", tab: "", category: "", brand: "", sort: "newest" };
const LIMITS = [20, 50, 100];

const TABS = [
  { id: "", label: "همه", count: "all" },
  { id: "active", label: "فعال", count: "active" },
  { id: "inactive", label: "غیرفعال", count: "inactive" },
  { id: "out", label: "ناموجود", count: "outOfStock" },
  { id: "low", label: "کم‌موجودی", count: "lowStock" },
  { id: "discounted", label: "دارای تخفیف", count: "discounted" },
];

const TAB_QUERY = {
  active: { active: "true" },
  inactive: { active: "false" },
  out: { stock: "out" },
  low: { stock: "low" },
  discounted: { discount: "active" },
};

const SORTS = [
  { id: "newest", label: "جدیدترین" },
  { id: "oldest", label: "قدیمی‌ترین" },
  { id: "nameAsc", label: "نام (الف تا ی)" },
  { id: "priceAsc", label: "ارزان‌ترین" },
  { id: "priceDesc", label: "گران‌ترین" },
];

const selectClass =
  "rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-paper focus:border-bronze focus:outline-none";

const StockCell = ({ product, onOpen }) => {
  const tone = product.stockStatus === "out" ? "danger" : product.stockStatus === "low" ? "warning" : "neutral";
  const text =
    product.stockStatus === "out"
      ? "ناموجود"
      : `${toPersianDigits(product.totalStock)} عدد${product.stockStatus === "low" ? " (کم)" : ""}`;

  return (
    <button onClick={onOpen} title="ویرایش سریع موجودی" className="rounded-full transition-opacity hover:opacity-80">
      <Badge tone={tone}>{text}</Badge>
    </button>
  );
};

const AdminProductsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { params, setParams } = useListParams(DEFAULTS);

  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;
  const tab = TABS.some((t) => t.id === params.tab) ? params.tab : "";
  const sort = SORTS.some((s) => s.id === params.sort) ? params.sort : "newest";
  const { search, category, brand } = params;

  const listQuery = useMemo(
    () => ({
      ...TAB_QUERY[tab],
      ...(search && { search }),
      ...(category && { category }),
      ...(brand && { brand }),
      ...(sort !== "newest" && { sort }),
      page: params.page,
      limit,
    }),
    [tab, search, category, brand, sort, params.page, limit],
  );

  const products = useAdminProducts(listQuery);
  const counts = useProductCounts();
  const categories = useAdminCategories();
  const brands = useAdminBrands();

  const bulkActive = useBulkSetActive();
  const remove = useDeleteProduct();
  const duplicate = useDuplicateProduct();

  const rows = products.data?.data ?? [];
  const serverPagination = products.data?.pagination;

  const categoryOptions = useMemo(
    () => flattenTree(buildCategoryTree(categories.data ?? [])),
    [categories.data],
  );

  const [selected, setSelected] = useState(() => new Set());
  const [stockProduct, setStockProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingId, setPendingId] = useState(null);

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
  const filtersActive = !!(tab || search || category || brand);

  const toggleAll = (checked) => setSelected(checked ? new Set(rows.map((r) => r._id)) : new Set());
  const toggleOne = (id, checked) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const resetFilters = () => setParams({ tab: "", search: "", category: "", brand: "" });

  const setActive = (ids, isActive, { single = false } = {}) => {
    if (single) setPendingId(ids[0]);

    bulkActive.mutate(
      { ids, isActive },
      {
        onSuccess: (result) => {
          toast.success(
            single
              ? isActive
                ? "محصول فعال شد"
                : "محصول غیرفعال شد"
              : `${toPersianDigits(result.updated)} محصول ${isActive ? "فعال" : "غیرفعال"} شد`,
          );
          if (!single) setSelected(new Set());
        },
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setPendingId(null),
      },
    );
  };

  const handleDuplicate = (product) => {
    setPendingId(product._id);
    duplicate.mutate(product._id, {
      onSuccess: () => toast.success("کپی ساخته شد (غیرفعال و بدون عکس، با موجودی صفر)"),
      onError: (err) => toast.error(parseApiError(err).message),
      onSettled: () => setPendingId(null),
    });
  };

  const handleDelete = () =>
    remove.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success("محصول حذف شد");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
        setDeleteTarget(null);
      },
    });

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
          label="انتخاب همه‌ی محصولات این صفحه"
        />
      ),
      cell: (p) => (
        <Checkbox checked={selected.has(p._id)} onChange={(c) => toggleOne(p._id, c)} label={`انتخاب ${p.name}`} />
      ),
    },
    {
      key: "product",
      header: "محصول",
      cell: (p) => {
        const image = getImageUrl(p.image);
        return (
          <div className="flex items-center gap-3">
            {image ? (
              <img src={image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-well">
                <PawPrint className="h-5 w-5 text-sage" strokeWidth={1.4} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-paper">{p.name}</p>
              <p dir="ltr" className="truncate text-right text-[11px] text-muted">
                {p.slug}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "brand",
      header: "برند",
      hideBelow: "lg",
      cell: (p) => <span className="text-muted">{p.brand?.name ?? "—"}</span>,
    },
    {
      key: "categories",
      header: "دسته‌بندی",
      hideBelow: "xl",
      cell: (p) =>
        p.categories.length === 0 ? (
          <span className="text-muted/60">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {p.categories.slice(0, 2).map((c) => (
              <Badge key={c._id}>{c.name}</Badge>
            ))}
            {p.categories.length > 2 && <Badge>+{toPersianDigits(p.categories.length - 2)}</Badge>}
          </div>
        ),
    },
    {
      key: "price",
      header: "قیمت",
      cell: (p) => (
        <div>
          <p className="text-paper">
            {p.minPrice === p.maxPrice ? formatToman(p.minPrice) : `از ${formatToman(p.minPrice)}`}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">{toPersianDigits(p.variantsCount)} واریانت</p>
          {p.discountActive && (
            <div className="mt-1">
              <Badge tone="warning">{toPersianDigits(p.discountPercent)}٪ تخفیف</Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      header: "موجودی",
      stopRowClick: true,
      cell: (p) => <StockCell product={p} onOpen={() => setStockProduct(p)} />,
    },
    {
      key: "active",
      header: "فعال",
      stopRowClick: true,
      cell: (p) => (
        <Switch
          checked={p.isActive}
          disabled={pendingId === p._id}
          label={p.isActive ? `غیرفعال کردن ${p.name}` : `فعال کردن ${p.name}`}
          onChange={(value) => setActive([p._id], value, { single: true })}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      stopRowClick: true,
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/admin/products/${p._id}`}
            title="ویرایش"
            aria-label={`ویرایش ${p.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-well hover:text-paper"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            title="کپی محصول"
            aria-label={`کپی ${p.name}`}
            disabled={pendingId === p._id}
            onClick={() => handleDuplicate(p)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="حذف"
            aria-label={`حذف ${p.name}`}
            className="hover:text-danger"
            onClick={() => setDeleteTarget(p)}
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
        title="محصولات"
        description={
          serverPagination ? `${toPersianDigits(serverPagination.total)} محصول` : "مدیریت کاتالوگ فروشگاه"
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="تازه‌سازی"
              title="تازه‌سازی"
              disabled={products.isFetching}
              onClick={() => {
                products.refetch();
                counts.refetch();
              }}
            >
              <RefreshCw className={`h-4 w-4 ${products.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Link to="/admin/products/new">
              <Button variant="primary" icon={Plus}>
                افزودن محصول
              </Button>
            </Link>
          </>
        }
      />

      <div
        role="tablist"
        aria-label="وضعیت محصول"
        className="mb-4 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          const count = counts.data?.[t.count];
          return (
            <button
              key={t.id || "all"}
              role="tab"
              aria-selected={active}
              onClick={() => setParams({ tab: t.id })}
              className={`relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm transition-colors ${
                active ? "text-paper" : "text-muted hover:text-paper"
              }`}
            >
              {t.label}
              {count !== undefined && (
                <span className={`text-xs ${active ? "text-bronze" : "text-muted/70"}`}>{toPersianDigits(count)}</span>
              )}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-bronze" />}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(value) => setParams({ search: value })}
          placeholder="نام، آدرس یا SKU محصول..."
          className="w-full max-w-sm"
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

        <select value={brand} onChange={(e) => setParams({ brand: e.target.value })} aria-label="برند" className={selectClass}>
          <option value="">همه‌ی برندها</option>
          {(brands.data ?? []).map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setParams({ sort: e.target.value })} aria-label="مرتب‌سازی" className={selectClass}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button onClick={resetFilters} className="text-xs text-bronze transition-opacity hover:opacity-80">
            حذف فیلترها
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div
          role="region"
          aria-label="عملیات گروهی"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bronze/40 bg-bronze/5 px-4 py-3"
        >
          <p className="text-sm text-paper">{toPersianDigits(selected.size)} محصول انتخاب شده</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              loading={bulkActive.isPending && pendingId === null}
              onClick={() => setActive([...selected], true)}
            >
              فعال کردن
            </Button>
            <Button
              size="sm"
              disabled={bulkActive.isPending}
              onClick={() => setActive([...selected], false)}
            >
              غیرفعال کردن
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
        loading={products.isLoading}
        fetching={products.isFetching && !products.isLoading}
        error={products.error}
        onRetry={products.refetch}
        onRowClick={(p) => navigate(`/admin/products/${p._id}`)}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: "محصولی پیدا نشد",
          message: filtersActive ? "فیلترها را تغییر دهید یا حذف کنید." : "هنوز محصولی ثبت نشده است.",
          action: filtersActive ? (
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              حذف فیلترها
            </Button>
          ) : (
            <Link to="/admin/products/new">
              <Button variant="primary" size="sm" icon={Plus}>
                افزودن محصول
              </Button>
            </Link>
          ),
        }}
      />

      <StockDrawer product={stockProduct} onClose={() => setStockProduct(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف محصول؟"
        message={
          deleteTarget
            ? `«${deleteTarget.name}» و همه‌ی واریانت‌ها و عکس‌هایش حذف می‌شود. محصولی که قبلاً فروخته شده قابل حذف نیست و باید غیرفعالش کنید.`
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

export default AdminProductsPage;