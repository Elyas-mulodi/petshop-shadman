import { useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Switch from "../../components/admin/ui/Switch";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import CategoryFormModal from "../../components/admin/catalog/CategoryFormModal";
import ErrorState from "../../components/common/ErrorState";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { useAdminCategories } from "../../features/admin/products/useAdminProducts";
import {
  useDeleteCategory,
  useSaveCategory,
} from "../../features/admin/catalog/useCatalog";
import { buildCategoryTree } from "../../features/admin/products/categoryTree";
import { getImageUrl } from "../../utils/imageUrl";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const MAX_LEVEL_INDEX = 2;

const flattenNodes = (nodes, depth = 0) =>
  nodes.flatMap((node) => [
    { node, depth },
    ...flattenNodes(node.children, depth + 1),
  ]);

const AdminCategoriesPage = () => {
  const toast = useToast();
  const query = useAdminCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    open: false,
    category: null,
    parentId: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const categories = useMemo(() => query.data ?? [], [query.data]);
  const roots = useMemo(() => buildCategoryTree(categories), [categories]);

  const rows = useMemo(() => {
    const all = flattenNodes(roots);
    const q = search.trim();
    if (!q) return all;

    const visible = new Set();
    const walk = (node, ancestors) => {
      if (node.name.includes(q)) {
        visible.add(node._id);
        ancestors.forEach((id) => visible.add(id));
      }
      node.children.forEach((child) => walk(child, [...ancestors, node._id]));
    };
    roots.forEach((root) => walk(root, []));

    return all.filter(({ node }) => visible.has(node._id));
  }, [roots, search]);

  const openCreate = (parentId = "") =>
    setForm({ open: true, category: null, parentId });
  const openEdit = (category) =>
    setForm({ open: true, category, parentId: "" });
  const closeForm = () => setForm((prev) => ({ ...prev, open: false }));

  const toggleActive = (node, value) => {
    setPendingId(node._id);
    save.mutate(
      { id: node._id, body: { isActive: String(value) } },
      {
        onSuccess: () =>
          toast.success(value ? "دسته‌بندی فعال شد" : "دسته‌بندی غیرفعال شد"),
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setPendingId(null),
      },
    );
  };

  const handleDelete = () =>
    remove.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success("دسته‌بندی حذف شد");
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
        title="دسته‌بندی‌ها"
        description={`${toPersianDigits(categories.length)} دسته‌بندی`}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openCreate()}>
            دسته‌بندی جدید
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="جستجوی نام دسته‌بندی..."
          className="max-w-sm"
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : query.error && !query.data ? (
        <ErrorState
          message="دریافت دسته‌بندی‌ها با خطا مواجه شد"
          onRetry={query.refetch}
        />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
          <FolderTree className="mb-4 h-10 w-10 text-sage" strokeWidth={1.3} />
          <p className="font-display text-base font-bold text-paper">
            {search
              ? "دسته‌بندی‌ای پیدا نشد"
              : "هنوز دسته‌بندی‌ای ساخته نشده است"}
          </p>
          {!search && (
            <Button
              variant="primary"
              icon={Plus}
              className="mt-5"
              onClick={() => openCreate()}
            >
              دسته‌بندی جدید
            </Button>
          )}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-card">
          {rows.map(({ node, depth }) => {
            const image = getImageUrl(node.image);
            return (
              <li
                key={node._id}
                style={{ paddingInlineStart: `${1 + depth * 1.75}rem` }}
                className="flex items-center gap-3 border-b border-line py-3 pe-4 last:border-b-0"
              >
                {image ? (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-well">
                    <FolderTree
                      className="h-4 w-4 text-sage"
                      strokeWidth={1.4}
                    />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-paper">
                    {node.name}
                    {!node.isActive && <Badge>غیرفعال</Badge>}
                  </p>
                  <p
                    dir="ltr"
                    className="truncate text-right text-[11px] text-muted"
                  >
                    {node.slug}
                  </p>
                </div>

                <span className="hidden text-xs text-muted sm:inline">
                  {toPersianDigits(node.productCount)} محصول
                </span>

                <Switch
                  checked={node.isActive}
                  disabled={pendingId === node._id}
                  label={
                    node.isActive
                      ? `غیرفعال کردن ${node.name}`
                      : `فعال کردن ${node.name}`
                  }
                  onChange={(value) => toggleActive(node, value)}
                />

                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={
                      depth >= MAX_LEVEL_INDEX
                        ? "حداکثر ۳ سطح مجاز است"
                        : "افزودن زیردسته"
                    }
                    aria-label={`افزودن زیردسته برای ${node.name}`}
                    disabled={depth >= MAX_LEVEL_INDEX}
                    onClick={() => openCreate(node._id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="ویرایش"
                    aria-label={`ویرایش ${node.name}`}
                    onClick={() => openEdit(node)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="حذف"
                    aria-label={`حذف ${node.name}`}
                    className="hover:text-danger"
                    onClick={() => setDeleteTarget(node)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CategoryFormModal
        open={form.open}
        category={form.category}
        defaultParentId={form.parentId}
        categories={categories}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف دسته‌بندی؟"
        message={
          deleteTarget
            ? `«${deleteTarget.name}» حذف می‌شود. دسته‌بندی‌ای که محصول یا زیردسته دارد حذف نمی‌شود و باید اول آن‌ها را جابه‌جا کنید.`
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

export default AdminCategoriesPage;
