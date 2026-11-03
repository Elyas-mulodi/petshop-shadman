import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import Badge from "../../components/admin/ui/Badge";
import Button from "../../components/admin/ui/Button";
import BlockUserModal from "../../components/admin/users/BlockUserModal";
import { useListParams } from "../../hooks/useListParams";
import {
  useAdminUsers,
  useTopCustomers,
  useUserCounts,
} from "../../features/admin/users/useAdminUsers";
import { formatToman } from "../../utils/price";
import { formatDate } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";

const DEFAULTS = { page: 1, limit: 20, search: "", status: "", sort: "newest" };
const LIMITS = [20, 50, 100];

const TABS = [
  { id: "", label: "همه", count: "all" },
  { id: "active", label: "فعال", count: "active" },
  { id: "unverified", label: "تایید نشده", count: "unverified" },
  { id: "blocked", label: "مسدود", count: "blocked" },
];

const SORTS = [
  { id: "newest", label: "جدیدترین" },
  { id: "oldest", label: "قدیمی‌ترین" },
  { id: "nameAsc", label: "نام (الف تا ی)" },
];

const StatusBadge = ({ user }) => {
  if (user.isBlocked) return <Badge tone="danger">مسدود</Badge>;
  if (!user.isVerified) return <Badge>تایید نشده</Badge>;
  return <Badge tone="success">فعال</Badge>;
};

const Avatar = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-well font-display text-sm font-bold text-bronze">
    {name ? [...name.trim()][0] : "؟"}
  </span>
);

const TopCustomers = () => {
  const query = useTopCustomers();
  const rows = query.data ?? [];

  if (query.isLoading)
    return <div className="mb-6 h-24 animate-pulse rounded-2xl bg-card" />;
  if (rows.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-display text-sm font-bold text-paper">
        برترین مشتریان (بر اساس مجموع خرید)
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {rows.map((c, i) => (
          <li key={c.userId}>
            <Link
              to={`/admin/users/${c.userId}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3 transition-colors hover:border-bronze/50"
            >
              <span className="font-display text-lg font-bold text-bronze">
                {toPersianDigits(i + 1)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-paper">
                  {c.name || c.phone}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {formatToman(c.spent)} ، {toPersianDigits(c.orders)} سفارش
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { params, setParams } = useListParams(DEFAULTS);

  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;
  const status = TABS.some((t) => t.id === params.status) ? params.status : "";
  const sort = SORTS.some((s) => s.id === params.sort) ? params.sort : "newest";
  const { search } = params;

  const query = useMemo(
    () => ({
      page: params.page,
      limit,
      ...(search && { search }),
      ...(status && { status }),
      ...(sort !== "newest" && { sort }),
    }),
    [params.page, limit, search, status, sort],
  );

  const users = useAdminUsers(query);
  const counts = useUserCounts();
  const [blockTarget, setBlockTarget] = useState(null);

  const rows = users.data?.data ?? [];
  const serverPagination = users.data?.pagination;

  useEffect(() => {
    if (
      serverPagination &&
      serverPagination.pages > 0 &&
      params.page > serverPagination.pages
    ) {
      setParams({ page: serverPagination.pages });
    }
  }, [serverPagination, params.page, setParams]);

  const filtersActive = !!(status || search);

  const columns = [
    {
      key: "user",
      header: "مشتری",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} />
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
      key: "orders",
      header: "سفارش‌ها",
      hideBelow: "md",
      cell: (user) => (
        <span className="text-paper">{toPersianDigits(user.stats.orders)}</span>
      ),
    },
    {
      key: "spent",
      header: "مجموع خرید",
      hideBelow: "md",
      cell: (user) => (
        <span
          className={user.stats.spent > 0 ? "text-bronze" : "text-muted/60"}
        >
          {user.stats.spent > 0 ? formatToman(user.stats.spent) : "—"}
        </span>
      ),
    },
    {
      key: "lastOrder",
      header: "آخرین سفارش",
      hideBelow: "xl",
      cell: (user) => (
        <span className="text-muted">
          {user.stats.lastOrderAt ? formatDate(user.stats.lastOrderAt) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "عضویت",
      hideBelow: "lg",
      cell: (user) => (
        <span className="text-muted">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: "status",
      header: "وضعیت",
      cell: (user) => <StatusBadge user={user} />,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      stopRowClick: true,
      cell: (user) => (
        <Button
          size="sm"
          variant={user.isBlocked ? "secondary" : "dangerOutline"}
          onClick={() => setBlockTarget(user)}
        >
          {user.isBlocked ? "رفع مسدودی" : "مسدود کردن"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="مشتریان"
        description={
          serverPagination
            ? `${toPersianDigits(serverPagination.total)} مشتری`
            : "مدیریت حساب مشتریان"
        }
        actions={
          <Button
            variant="secondary"
            size="icon"
            aria-label="تازه‌سازی"
            title="تازه‌سازی"
            disabled={users.isFetching}
            onClick={() => {
              users.refetch();
              counts.refetch();
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${users.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        }
      />

      {!filtersActive && <TopCustomers />}

      <div
        role="tablist"
        aria-label="وضعیت مشتری"
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
                <span
                  className={`text-xs ${active ? "text-bronze" : "text-muted/70"}`}
                >
                  {toPersianDigits(count)}
                </span>
              )}
              {active && (
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
          placeholder="جستجوی نام، موبایل یا ایمیل..."
          className="w-full max-w-sm"
        />
        <select
          value={sort}
          onChange={(e) => setParams({ sort: e.target.value })}
          aria-label="مرتب‌سازی"
          className="rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-paper focus:border-bronze focus:outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {filtersActive && (
          <button
            onClick={() => setParams({ status: "", search: "" })}
            className="text-xs text-bronze transition-opacity hover:opacity-80"
          >
            حذف فیلترها
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={users.isLoading}
        fetching={users.isFetching && !users.isLoading}
        error={users.error}
        onRetry={users.refetch}
        onRowClick={(user) => navigate(`/admin/users/${user._id}`)}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: "مشتری‌ای پیدا نشد",
          message: filtersActive
            ? "فیلتر یا عبارت جستجو را تغییر دهید."
            : "هنوز کسی ثبت‌نام نکرده است.",
        }}
      />

      <BlockUserModal user={blockTarget} onClose={() => setBlockTarget(null)} />
    </>
  );
};

export default AdminUsersPage;
