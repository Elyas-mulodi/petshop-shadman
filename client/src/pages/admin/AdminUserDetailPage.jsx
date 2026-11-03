import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Gift,
  History,
  MapPin,
  Package,
  Ticket,
  UserX,
} from "lucide-react";
import Button from "../../components/admin/ui/Button";
import Badge from "../../components/admin/ui/Badge";
import BlockUserModal from "../../components/admin/users/BlockUserModal";
import UserNotesCard from "../../components/admin/users/UserNotesCard";
import StatusBadge from "../../components/orders/StatusBadge";
import { Card } from "../../components/profile/ProfileParts";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { useAdminUser } from "../../features/admin/users/useAdminUsers";
import { useAuditLogs } from "../../features/admin/audit/useAuditLogs";
import { getActiveLoyalty } from "../../utils/loyalty";
import { formatToman } from "../../utils/price";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl border border-line bg-card px-4 py-3.5">
    <p className="font-display text-lg font-bold text-paper">{value}</p>
    <p className="mt-1 text-xs text-muted">{label}</p>
  </div>
);

const ActivityCard = ({ userId, phone }) => {
  const query = useAuditLogs({ entityId: userId, limit: 6 });
  const logs = query.data?.data ?? [];

  return (
    <Card icon={History} title="فعالیت‌های ادمین روی این حساب">
      {query.isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-well" />
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted">فعالیتی ثبت نشده است.</p>
      ) : (
        <ul className="divide-y divide-line">
          {logs.map((log) => (
            <li key={log._id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm leading-6 text-paper">{log.summary}</p>
              <p className="mt-1 text-[11px] text-muted">
                {log.actorLabel || "ادمین"} ، {formatDateTime(log.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Link
        to={`/admin/activity?search=${encodeURIComponent(phone)}`}
        className="mt-4 inline-block text-xs text-bronze hover:opacity-80"
      >
        مشاهده‌ی همه
      </Link>
    </Card>
  );
};

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAdminUser(id);
  const [blockTarget, setBlockTarget] = useState(null);

  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/admin/users");

  const BackButton = (
    <button
      onClick={goBack}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-paper"
    >
      <ArrowRight className="h-4 w-4" />
      بازگشت
    </button>
  );

  if (isLoading) {
    return (
      <>
        <Skeleton className="mb-5 h-5 w-20" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </>
    );
  }

  if (error?.response?.status === 404) {
    return (
      <>
        {BackButton}
        <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
          <UserX className="mb-4 h-10 w-10 text-sage" strokeWidth={1.3} />
          <p className="font-display text-base font-bold text-paper">
            مشتری پیدا نشد
          </p>
        </div>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        {BackButton}
        <ErrorState
          message="دریافت اطلاعات مشتری با خطا مواجه شد"
          onRetry={refetch}
        />
      </>
    );
  }

  const { user, stats, recentOrders, addresses, coupons } = data;
  const loyalty = getActiveLoyalty(user);

  return (
    <>
      {BackButton}

      <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-well font-display text-2xl font-bold text-bronze">
              {user.name ? [...user.name.trim()][0] : "؟"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-paper md:text-2xl">
                  {user.name || "بدون نام"}
                </h1>
                {user.isBlocked ? (
                  <Badge tone="danger">مسدود</Badge>
                ) : !user.isVerified ? (
                  <Badge>تایید نشده</Badge>
                ) : (
                  <Badge tone="success">فعال</Badge>
                )}
              </div>
              <p dir="ltr" className="mt-1 text-right text-sm text-muted">
                {user.phone}
              </p>
              {user.email && (
                <p dir="ltr" className="text-right text-xs text-muted">
                  {user.email}
                </p>
              )}
              <p className="mt-1.5 text-xs text-sage">
                عضو از {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/admin/orders?search=${encodeURIComponent(user.phone)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-bronze/60 hover:text-bronze"
            >
              سفارش‌های این مشتری
            </Link>
            <Button
              variant={user.isBlocked ? "secondary" : "dangerOutline"}
              onClick={() => setBlockTarget(user)}
            >
              {user.isBlocked ? "رفع مسدودی" : "مسدود کردن"}
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-3">
        {user.isBlocked && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3.5"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-paper">
                این حساب مسدود است
              </p>
              <p className="mt-1 text-xs leading-6 text-muted">
                {user.blockedAt && <>از {formatDateTime(user.blockedAt)}. </>}
                {user.blockedReason
                  ? `دلیل: ${user.blockedReason}`
                  : "دلیلی ثبت نشده است."}
              </p>
            </div>
          </div>
        )}
        {!user.isVerified && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-line bg-card px-4 py-3.5"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            <p className="text-xs leading-6 text-muted">
              این شماره ثبت‌نام را کامل نکرده است (کد تایید یا رمز عبور را ثبت
              نکرده).
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat
          label="سفارش‌های موفق"
          value={toPersianDigits(stats.paidOrders)}
        />
        <MiniStat
          label="مجموع خرید"
          value={stats.spent > 0 ? formatToman(stats.spent) : "—"}
        />
        <MiniStat
          label="میانگین هر سفارش"
          value={stats.average > 0 ? formatToman(stats.average) : "—"}
        />
        <MiniStat
          label="لغو یا مرجوع"
          value={toPersianDigits(stats.cancelled)}
        />
      </div>
      {stats.firstOrderAt && (
        <p className="mt-3 text-xs text-muted">
          اولین سفارش: {formatDate(stats.firstOrderAt)} ، آخرین سفارش:{" "}
          {formatDate(stats.lastOrderAt)}
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card icon={Package} title="آخرین سفارش‌ها">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted">
                این مشتری هنوز سفارشی ثبت نکرده است.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {recentOrders.map((order) => (
                  <li key={order._id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="flex items-center justify-between gap-3 transition-colors hover:text-bronze"
                    >
                      <div className="min-w-0">
                        <p dir="ltr" className="text-right text-sm text-paper">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatDate(order.createdAt)} ،{" "}
                          {toPersianDigits(
                            order.items.reduce((s, i) => s + i.quantity, 0),
                          )}{" "}
                          عدد کالا
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm text-bronze">
                          {formatToman(order.totalAmount)}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <ActivityCard userId={user._id} phone={user.phone} />
        </div>

        <div className="space-y-6">
          <Card icon={Gift} title="باشگاه مشتریان">
            {loyalty ? (
              <>
                <p className="font-display text-3xl font-bold text-bronze">
                  {toPersianDigits(loyalty.percent)}٪
                </p>
                <p className="mt-1 text-xs leading-6 text-muted">
                  تخفیف وفاداری فعال برای سفارش بعدی،{" "}
                  {toPersianDigits(loyalty.daysLeft)} روز دیگر معتبر است (تا{" "}
                  {formatDate(loyalty.expiresAt)}).
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">تخفیف وفاداری فعالی ندارد.</p>
            )}
          </Card>

          <Card icon={MapPin} title="آدرس‌های استفاده‌شده">
            {addresses.length === 0 ? (
              <p className="text-sm text-muted">آدرسی ثبت نشده است.</p>
            ) : (
              <ul className="divide-y divide-line">
                {addresses.map((a, i) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm text-paper">{a.fullName}</p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {a.province}، {a.city}، {a.addressLine}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      کد پستی {toPersianDigits(a.postalCode)} ،{" "}
                      {toPersianDigits(a.count)} بار استفاده، آخرین بار{" "}
                      {formatDate(a.lastUsedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card icon={Ticket} title="کدهای تخفیف استفاده‌شده">
            {coupons.length === 0 ? (
              <p className="text-sm text-muted">
                از کد تخفیفی استفاده نکرده است.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coupons.map((code) => (
                  <Badge key={code}>
                    <span dir="ltr">{code}</span>
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <UserNotesCard userId={user._id} notes={user.adminNotes ?? []} />
        </div>
      </div>

      <BlockUserModal user={blockTarget} onClose={() => setBlockTarget(null)} />
    </>
  );
};

export default AdminUserDetailPage;
