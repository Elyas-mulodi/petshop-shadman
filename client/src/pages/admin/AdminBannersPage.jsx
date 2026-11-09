import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageOff, LayoutTemplate, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import DataTable from "../../components/admin/ui/DataTable";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { Card } from "../../components/profile/ProfileParts";
import ActiveSwitch from "../../components/admin/banners/ActiveSwitch";
import BannerBentoOverview from "../../components/admin/banners/BannerBentoOverview";
import { SLOT_LABELS, getBannerStatus } from "../../components/admin/banners/bannerUtils";
import {
  useAdminBanners,
  useDeleteBanner,
  useUpdateBanner,
} from "../../features/admin/banners/useAdminBanners";
import { getImageUrl } from "../../utils/imageUrl";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const AdminBannersPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const banners = useAdminBanners();
  const update = useUpdateBanner();
  const remove = useDeleteBanner();

  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rows = banners.data ?? [];
  const liveCount = rows.filter((b) => getBannerStatus(b).live).length;

  const edit = (banner) => navigate(`/admin/banners/${banner._id}`);

  const toggle = (banner) => {
    setTogglingId(banner._id);
    update.mutate(
      { id: banner._id, body: { isActive: !banner.isActive } },
      {
        onSuccess: () => toast.success(banner.isActive ? "بنر از سایت برداشته شد" : "بنر فعال شد"),
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setTogglingId(null),
      },
    );
  };

  const confirmDelete = () =>
    remove.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success("بنر حذف شد");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
        setDeleteTarget(null);
      },
    });

  const columns = [
    {
      key: "image",
      header: "",
      width: 72,
      cell: (banner) => {
        const image = getImageUrl(banner.image);
        return image ? (
          <img src={image} alt="" loading="lazy" className="h-10 w-14 rounded-md object-cover" />
        ) : (
          <span className="flex h-10 w-14 items-center justify-center rounded-md bg-well">
            <ImageOff className="h-4 w-4 text-muted/60" />
          </span>
        );
      },
    },
    {
      key: "title",
      header: "بنر",
      cell: (banner) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-paper">{banner.title}</p>
          {banner.subtitle && <p className="truncate text-xs text-muted">{banner.subtitle}</p>}
        </div>
      ),
    },
    { key: "slot", header: "تایل", hideBelow: "md", cell: (banner) => <Badge>{SLOT_LABELS[banner.slot]}</Badge> },
    {
      key: "status",
      header: "وضعیت",
      cell: (banner) => {
        const status = getBannerStatus(banner);
        return <Badge tone={status.live ? "success" : undefined}>{status.label}</Badge>;
      },
    },
    {
      key: "order",
      header: "ترتیب",
      hideBelow: "lg",
      cell: (banner) => <span className="text-muted">{toPersianDigits(banner.order)}</span>,
    },
    {
      key: "active",
      header: "فعال",
      stopRowClick: true,
      cell: (banner) => (
        <ActiveSwitch
          checked={banner.isActive}
          disabled={togglingId === banner._id}
          onChange={() => toggle(banner)}
          label={`فعال بودن ${banner.title}`}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      stopRowClick: true,
      cell: (banner) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="ویرایش" title="ویرایش" onClick={() => edit(banner)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="حذف" title="حذف" onClick={() => setDeleteTarget(banner)}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="بنرها"
        description={banners.data ? `${toPersianDigits(rows.length)} بنر ، ${toPersianDigits(liveCount)} در حال نمایش` : "مدیریت هیرو صفحه‌ی اصلی"}
        actions={
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="تازه‌سازی"
              title="تازه‌سازی"
              disabled={banners.isFetching}
              onClick={() => banners.refetch()}
            >
              <RefreshCw className={`h-4 w-4 ${banners.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" icon={Plus} onClick={() => navigate("/admin/banners/new")}>
              بنر جدید
            </Button>
          </>
        }
      />

      <Card
        icon={LayoutTemplate}
        title="هیرو صفحه‌ی اصلی"
        hint="هر تایل اولین بنر فعالش (کمترین ترتیب) را نشان می‌دهد. روی هر تایل بزنید تا ویرایش شود."
      >
        <BannerBentoOverview
          banners={rows}
          onOpen={edit}
          onAdd={(slot) => navigate(`/admin/banners/new?slot=${slot}`)}
        />
        <p className="text-xs text-muted md:hidden">پیش‌نمایش هیرو فقط در صفحه‌ی بزرگ‌تر نمایش داده می‌شود.</p>
      </Card>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={banners.isLoading}
          fetching={banners.isFetching && !banners.isLoading}
          error={banners.error}
          onRetry={banners.refetch}
          onRowClick={edit}
          empty={{
            title: "هنوز بنری ساخته نشده است",
            message: "با ساخت بنر، متن و تصویر هیرو صفحه‌ی اصلی را بدون تغییر کد عوض کنید.",
            action: (
              <Button size="sm" icon={Plus} onClick={() => navigate("/admin/banners/new")}>
                بنر جدید
              </Button>
            ),
          }}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف بنر؟"
        message={`«${deleteTarget?.title ?? ""}» برای همیشه حذف می‌شود و این کار قابل بازگشت نیست.`}
        confirmLabel="حذف بنر"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default AdminBannersPage;