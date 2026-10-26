import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";
import Drawer from "../../components/admin/ui/Drawer";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import { useToast } from "../../components/admin/ui/ToastProvider";
import { useListParams } from "../../hooks/useListParams";
import { useAdminUsers, useToggleBlockUser } from "../../features/admin/users/useAdminUsers";
import { formatDate } from "../../utils/formatDate";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";

const DEFAULTS = { page: 1, limit: 20, search: "" };
const LIMITS = [20, 50, 100];

const StatusBadge = ({ user }) => {
  if (user.isBlocked) return <Badge tone="danger">مسدود</Badge>;
  if (!user.isVerified) return <Badge>تایید نشده</Badge>;
  return <Badge tone="success">فعال</Badge>;
};

const DetailRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 border-b border-line py-3 text-sm last:border-b-0">
    <dt className="text-muted">{label}</dt>
    <dd className="text-paper">{children}</dd>
  </div>
);

const AdminUsersPage = () => {
  const toast = useToast();
  const { params, setParams } = useListParams(DEFAULTS);
  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;

  const query = useMemo(
    () => ({ page: params.page, limit, ...(params.search && { search: params.search }) }),
    [params.page, params.search, limit],
  );

  const { data, isLoading, isFetching, error, refetch } = useAdminUsers(query);
  const toggleBlock = useToggleBlockUser();

  const [confirmUser, setConfirmUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);

  const rows = data?.data ?? [];
  const serverPagination = data?.pagination;

  // اگه بعد از جستجو یا حذف، صفحه‌ی فعلی از آخرین صفحه جلوتره، برگرد به آخرین صفحه
  useEffect(() => {
    if (serverPagination && serverPagination.pages > 0 && params.page > serverPagination.pages) {
      setParams({ page: serverPagination.pages });
    }
  }, [serverPagination, params.page, setParams]);

  const handleConfirm = () => {
    toggleBlock.mutate(confirmUser._id, {
      onSuccess: (res) => {
        toast.success(res.message);
        setConfirmUser(null);
      },
      onError: (err) => toast.error(parseApiError(err).message),
    });
  };

  const columns = [
    {
      key: "user",
      header: "کاربر",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-well font-display text-sm font-bold text-bronze">
            {user.name ? [...user.name.trim()][0] : "؟"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-paper">{user.name || "بدون نام"}</p>
            <p dir="ltr" className="text-right text-xs text-muted">
              {user.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "ایمیل",
      hideBelow: "lg",
      cell: (user) =>
        user.email ? (
          <span dir="ltr" className="text-muted">
            {user.email}
          </span>
        ) : (
          <span className="text-muted/60">—</span>
        ),
    },
    {
      key: "createdAt",
      header: "تاریخ عضویت",
      hideBelow: "md",
      cell: (user) => <span className="text-muted">{formatDate(user.createdAt)}</span>,
    },
    { key: "status", header: "وضعیت", cell: (user) => <StatusBadge user={user} /> },
    {
      key: "actions",
      header: "",
      align: "end",
      stopRowClick: true,
      cell: (user) => (
        <Button
          size="sm"
          variant={user.isBlocked ? "secondary" : "dangerOutline"}
          onClick={() => setConfirmUser(user)}
        >
          {user.isBlocked ? "رفع مسدودی" : "مسدود کردن"}
        </Button>
      ),
    },
  ];

  const blocking = confirmUser && !confirmUser.isBlocked;

  return (
    <>
      <PageHeader
        title="کاربران"
        description={
          serverPagination
            ? `${toPersianDigits(serverPagination.total)} کاربر ثبت‌شده`
            : "مدیریت حساب مشتریان"
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            تازه‌سازی
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={params.search}
          onChange={(search) => setParams({ search })}
          placeholder="جستجوی نام، موبایل یا ایمیل..."
          className="max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        fetching={isFetching && !isLoading}
        error={error}
        onRetry={refetch}
        onRowClick={setDetailUser}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: "کاربری پیدا نشد",
          message: params.search ? "عبارت جستجو را تغییر دهید." : "هنوز کاربری ثبت‌نام نکرده است.",
        }}
      />

      <ConfirmDialog
        open={!!confirmUser}
        title={blocking ? "مسدود کردن کاربر؟" : "رفع مسدودی کاربر؟"}
        message={
          blocking
            ? "کاربر مسدودشده نمی‌تواند وارد حساب خود شود و دسترسی‌هایش قطع می‌شود."
            : "کاربر دوباره می‌تواند وارد حساب خود شود."
        }
        confirmLabel={blocking ? "مسدود شود" : "رفع مسدودی"}
        tone={blocking ? "danger" : "primary"}
        loading={toggleBlock.isPending}
        onConfirm={handleConfirm}
        onClose={() => setConfirmUser(null)}
      />

      <Drawer
        open={!!detailUser}
        title={detailUser?.name || "کاربر بدون نام"}
        description="اطلاعات حساب"
        onClose={() => setDetailUser(null)}
      >
        {detailUser && (
          <dl>
            <DetailRow label="موبایل">
              <span dir="ltr">{detailUser.phone}</span>
            </DetailRow>
            <DetailRow label="ایمیل">
              {detailUser.email ? <span dir="ltr">{detailUser.email}</span> : "—"}
            </DetailRow>
            <DetailRow label="تاریخ عضویت">{formatDate(detailUser.createdAt)}</DetailRow>
            <DetailRow label="وضعیت">
              <StatusBadge user={detailUser} />
            </DetailRow>
          </dl>
        )}
      </Drawer>
    </>
  );
};

export default AdminUsersPage;