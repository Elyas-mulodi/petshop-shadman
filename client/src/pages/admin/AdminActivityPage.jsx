import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/admin/ui/PageHeader";
import SearchInput from "../../components/admin/ui/SearchInput";
import DataTable from "../../components/admin/ui/DataTable";
import Drawer from "../../components/admin/ui/Drawer";
import Badge from "../../components/admin/ui/Badge";
import { useListParams } from "../../hooks/useListParams";
import { useAuditLogs } from "../../features/admin/audit/useAuditLogs";
import { formatDateTime } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";
import { isDay } from "../../utils/tehranDate";

const DEFAULTS = {
  page: 1,
  limit: 30,
  search: "",
  entityType: "",
  from: "",
  to: "",
};
const LIMITS = [30, 50, 100];

const ENTITY_LABELS = {
  settings: "تنظیمات",
  order: "سفارش",
  product: "محصول",
  coupon: "کد تخفیف",
  user: "کاربر",
};

const ISO = /^\d{4}-\d{2}-\d{2}T/;

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "number")
    return toPersianDigits(value.toLocaleString("en-US"));
  if (typeof value === "string" && ISO.test(value))
    return formatDateTime(value);
  return String(value);
};

const dateInput =
  "rounded-lg border border-line bg-card px-3 py-2 text-xs text-paper [color-scheme:dark] focus:border-bronze focus:outline-none";

const AdminActivityPage = () => {
  const { params, setParams } = useListParams(DEFAULTS);

  const limit = LIMITS.includes(params.limit) ? params.limit : DEFAULTS.limit;
  const entityType = ENTITY_LABELS[params.entityType] ? params.entityType : "";
  const from = isDay(params.from) ? params.from : "";
  const to = isDay(params.to) ? params.to : "";
  const { search } = params;

  const query = useMemo(
    () => ({
      page: params.page,
      limit,
      ...(search && { search }),
      ...(entityType && { entityType }),
      ...(from && { from }),
      ...(to && { to }),
    }),
    [params.page, limit, search, entityType, from, to],
  );

  const logs = useAuditLogs(query);
  const rows = logs.data?.data ?? [];
  const serverPagination = logs.data?.pagination;
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (
      serverPagination &&
      serverPagination.pages > 0 &&
      params.page > serverPagination.pages
    ) {
      setParams({ page: serverPagination.pages });
    }
  }, [serverPagination, params.page, setParams]);

  const filtersActive = !!(search || entityType || from || to);

  const columns = [
    {
      key: "time",
      header: "زمان",
      cell: (log) => (
        <span className="whitespace-nowrap text-muted">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
    {
      key: "actor",
      header: "ادمین",
      hideBelow: "md",
      cell: (log) => (
        <span className="text-paper">{log.actorLabel || "—"}</span>
      ),
    },
    {
      key: "type",
      header: "نوع",
      hideBelow: "md",
      cell: (log) => (
        <Badge>{ENTITY_LABELS[log.entityType] ?? log.entityType}</Badge>
      ),
    },
    {
      key: "summary",
      header: "فعالیت",
      cell: (log) => (
        <div>
          <p className="text-paper">{log.summary}</p>
          {log.changes.length > 0 && (
            <p className="mt-0.5 text-[11px] text-bronze">
              {toPersianDigits(log.changes.length)} تغییر، برای جزئیات کلیک کنید
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="لاگ فعالیت"
        description={
          serverPagination
            ? `${toPersianDigits(serverPagination.total)} فعالیت ثبت‌شده`
            : "تاریخچه‌ی تغییرهای ادمین‌ها"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(value) => setParams({ search: value })}
          placeholder="جستجو در فعالیت، شماره سفارش، نام ادمین..."
          className="w-full max-w-sm"
        />

        <select
          value={entityType}
          onChange={(e) => setParams({ entityType: e.target.value })}
          aria-label="نوع فعالیت"
          className="rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-paper focus:border-bronze focus:outline-none"
        >
          <option value="">همه‌ی انواع</option>
          {Object.entries(ENTITY_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>

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

        {filtersActive && (
          <button
            onClick={() =>
              setParams({ search: "", entityType: "", from: "", to: "" })
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
        loading={logs.isLoading}
        fetching={logs.isFetching && !logs.isLoading}
        error={logs.error}
        onRetry={logs.refetch}
        onRowClick={setDetail}
        pagination={serverPagination && { ...serverPagination, limit }}
        onPageChange={(page) => setParams({ page })}
        onLimitChange={(next) => setParams({ limit: next })}
        limitOptions={LIMITS}
        empty={{
          title: filtersActive
            ? "فعالیتی پیدا نشد"
            : "هنوز فعالیتی ثبت نشده است",
          message: filtersActive
            ? "فیلترها را تغییر دهید."
            : "تغییرهای ادمین‌ها از این پس اینجا ثبت می‌شود.",
        }}
      />

      <Drawer
        open={!!detail}
        title={
          detail ? (ENTITY_LABELS[detail.entityType] ?? detail.entityType) : ""
        }
        description={detail ? formatDateTime(detail.createdAt) : ""}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <>
            <p className="text-sm leading-7 text-paper">{detail.summary}</p>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">ادمین</dt>
                <dd className="text-paper">{detail.actorLabel || "—"}</dd>
              </div>
              {detail.entityLabel && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">مورد</dt>
                  <dd className="text-paper">{detail.entityLabel}</dd>
                </div>
              )}
              {detail.ip && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">IP</dt>
                  <dd dir="ltr" className="text-paper">
                    {detail.ip}
                  </dd>
                </div>
              )}
            </dl>

            {detail.changes.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-3 text-xs font-medium text-muted">تغییرها</p>
                <ul className="space-y-3">
                  {detail.changes.map((c) => (
                    <li key={c.field} className="rounded-lg bg-ink px-3.5 py-3">
                      <p className="text-xs text-muted">{c.label || c.field}</p>
                      <p className="mt-1.5 text-sm">
                        <span className="text-muted line-through">
                          {formatValue(c.from)}
                        </span>
                        <span className="mx-2 text-muted">به</span>
                        <span className="text-bronze">{formatValue(c.to)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  );
};

export default AdminActivityPage;
