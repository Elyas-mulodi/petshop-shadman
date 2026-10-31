import { useMemo, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Switch from "../../components/admin/ui/Switch";
import Button from "../../components/admin/ui/Button";
import BrandFormModal from "../../components/admin/catalog/BrandFormModal";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { useAdminBrands } from "../../features/admin/products/useAdminProducts";
import {
  useDeleteBrand,
  useSaveBrand,
} from "../../features/admin/catalog/useCatalog";
import { getImageUrl } from "../../utils/imageUrl";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const AdminBrandsPage = () => {
  const toast = useToast();
  const query = useAdminBrands();
  const save = useSaveBrand();
  const remove = useDeleteBrand();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ open: false, brand: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const brands = useMemo(() => query.data ?? [], [query.data]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands;
  }, [brands, search]);

  const toggleActive = (brand, value) => {
    setPendingId(brand._id);
    save.mutate(
      { id: brand._id, body: { isActive: String(value) } },
      {
        onSuccess: () =>
          toast.success(value ? "برند فعال شد" : "برند غیرفعال شد"),
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setPendingId(null),
      },
    );
  };

  const handleDelete = () =>
    remove.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success("برند حذف شد");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
        setDeleteTarget(null);
      },
    });

  const columns = [
    {
      key: "brand",
      header: "برند",
      cell: (b) => {
        const logo = getImageUrl(b.logo);
        return (
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt=""
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-lg bg-well object-contain p-1"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-well">
                <Tag className="h-4 w-4 text-sage" strokeWidth={1.4} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-paper">{b.name}</p>
              <p
                dir="ltr"
                className="truncate text-right text-[11px] text-muted"
              >
                {b.slug}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "products",
      header: "محصولات",
      hideBelow: "md",
      cell: (b) => (
        <span className="text-muted">{toPersianDigits(b.productCount)}</span>
      ),
    },
    {
      key: "active",
      header: "فعال",
      cell: (b) => (
        <Switch
          checked={b.isActive}
          disabled={pendingId === b._id}
          label={b.isActive ? `غیرفعال کردن ${b.name}` : `فعال کردن ${b.name}`}
          onChange={(value) => toggleActive(b, value)}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (b) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="ویرایش"
            aria-label={`ویرایش ${b.name}`}
            onClick={() => setForm({ open: true, brand: b })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="حذف"
            aria-label={`حذف ${b.name}`}
            className="hover:text-danger"
            onClick={() => setDeleteTarget(b)}
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
        title="برندها"
        description={`${toPersianDigits(brands.length)} برند`}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setForm({ open: true, brand: null })}
          >
            برند جدید
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="جستجوی نام برند..."
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isLoading}
        fetching={query.isFetching && !query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        onRowClick={(b) => setForm({ open: true, brand: b })}
        empty={{
          title: search ? "برندی پیدا نشد" : "هنوز برندی ساخته نشده است",
          message: search ? "عبارت جستجو را تغییر دهید." : undefined,
        }}
      />

      <BrandFormModal
        open={form.open}
        brand={form.brand}
        onClose={() => setForm((prev) => ({ ...prev, open: false }))}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف برند؟"
        message={
          deleteTarget
            ? `«${deleteTarget.name}» حذف می‌شود. برندی که محصول دارد حذف نمی‌شود و باید اول محصولاتش را جابه‌جا کنید.`
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

export default AdminBrandsPage;
