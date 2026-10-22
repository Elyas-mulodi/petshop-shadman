import { PawPrint, Pencil } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";
import { getActiveLoyalty } from "../../utils/loyalty";

const Stat = ({ label, accent, children }) => (
  <div className="min-w-0">
    <p
      className={`font-display text-base font-bold md:text-xl ${accent ? "text-bronze" : "text-paper"}`}
    >
      {children}
    </p>
    <p className="mt-1 text-xs text-muted">{label}</p>
  </div>
);

const ProfileHeader = ({ user, stats, statsLoading, onEdit }) => {
  const loyalty = getActiveLoyalty(user);
  const initial = user?.name ? [...user.name.trim()][0] : null;
  const dash = "—";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-card">
      {/* نور برنزی گوشه‌ی بالا */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--color-bronze) 16%, transparent), transparent 55%)",
        }}
      />
      <PawPrint
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-6 h-44 w-44 -rotate-12 text-paper/[0.035]"
        strokeWidth={1.2}
      />

      <div className="relative p-5 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="shrink-0 self-start rounded-full bg-gradient-to-br from-bronze via-bronze/50 to-sage/60 p-[2px] sm:self-auto">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink font-display text-3xl font-bold text-bronze md:h-24 md:w-24 md:text-4xl">
              {initial || (
                <PawPrint className="h-9 w-9 text-sage" strokeWidth={1.4} />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold text-paper md:text-2xl">
              {user?.name || "کاربر پت شاپ"}
            </h1>
            <p dir="ltr" className="mt-1 text-right text-sm text-muted">
              {user?.phone}
            </p>
            {user?.createdAt && (
              <p className="mt-2 text-xs text-sage">
                عضو از {formatDate(user.createdAt)}
              </p>
            )}
          </div>

          <button
            onClick={onEdit}
            className="flex items-center gap-2 self-start rounded-lg border border-line px-4 py-2 text-sm text-paper transition-colors hover:border-bronze/60 hover:text-bronze sm:self-center"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.7} />
            ویرایش اطلاعات
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
          <Stat label="سفارش‌ها">
            {statsLoading ? dash : toPersianDigits(stats.ordersCount)}
          </Stat>
          <Stat label="مجموع خرید">
            {statsLoading ? (
              dash
            ) : (
              <>
                {toPersianDigits(stats.totalSpent.toLocaleString("en-US"))}
                <span className="mr-1 text-[11px] font-normal text-muted">
                  تومان
                </span>
              </>
            )}
          </Stat>
          <Stat label="تخفیف وفاداری" accent={!!loyalty}>
            {loyalty ? `${toPersianDigits(loyalty.percent)}٪` : dash}
          </Stat>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;
