import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Clock, Gift, ShoppingBag, Sparkles } from "lucide-react";
import Skeleton from "../common/Skeleton";
import { getLoyaltyTiers } from "../../features/loyalty/loyaltyApi";
import { LOYALTY_VALID_DAYS, getActiveLoyalty } from "../../utils/loyalty";
import { formatToman } from "../../utils/price";
import { formatDate } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";

const ease = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    title: "خرید خود را کامل کنید",
    text: "بعد از هر پرداخت موفق، جمع کالاهای سفارش با پله‌های تخفیف سنجیده می‌شود.",
  },
  {
    title: "تخفیف برای خرید بعدی فعال می‌شود",
    text: "درصد تخفیف شما در همین صفحه نمایش داده می‌شود.",
  },
  {
    title: `${toPersianDigits(LOYALTY_VALID_DAYS)} روز فرصت دارید`,
    text: "هنگام ثبت سفارش خودکار اعمال می‌شود، مگر اینکه کد تخفیف وارد کنید.",
  },
];

const glow = {
  background:
    "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--color-bronze) 14%, transparent), transparent 55%)",
};

const LoyaltyTab = ({ user }) => {
  const [tiers, setTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const loyalty = getActiveLoyalty(user);

  useEffect(() => {
    let cancelled = false;
    getLoyaltyTiers()
      .then((res) => !cancelled && setTiers(res.data.data))
      .catch(() => {})
      .finally(() => !cancelled && setTiersLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTierIndex = loyalty
    ? tiers.findIndex((t) => t.discountPercent === loyalty.percent)
    : -1;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={glow}
        />

        {loyalty ? (
          <div className="relative grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:items-center md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-xs text-sage">
                <Sparkles className="h-3.5 w-3.5" />
                تخفیف وفاداری فعال
              </p>
              <p className="font-display text-6xl font-bold leading-none text-bronze md:text-7xl">
                {toPersianDigits(loyalty.percent)}
                <span className="text-4xl md:text-5xl">٪</span>
              </p>
              <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
                روی سفارش بعدی شما به‌صورت خودکار اعمال می‌شود.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-ink/60 p-4">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  اعتبار تخفیف
                </span>
                <span className="text-paper">
                  {toPersianDigits(loyalty.daysLeft)} روز مانده
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-well">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loyalty.ratio * 100}%` }}
                  transition={{ duration: 0.8, ease }}
                  className="h-full rounded-full bg-bronze"
                />
              </div>
              <p className="mt-3 text-xs text-muted">
                معتبر تا {formatDate(loyalty.expiresAt)}
              </p>
              <Link
                to="/products"
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                <ShoppingBag className="h-4 w-4" />
                ادامه خرید
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-well text-sage">
              <Gift className="h-7 w-7" strokeWidth={1.4} />
            </span>
            <h2 className="font-display text-lg font-bold text-paper">
              هنوز تخفیف وفاداری فعال ندارید
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-7 text-muted">
              با ثبت سفارش، تخفیف مخصوص خرید بعدی شما فعال می‌شود. هرچه جمع
              کالاها بیشتر باشد، درصد تخفیف بالاتر است.
            </p>
            <Link
              to="/products"
              className="mt-6 rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              مشاهده محصولات
            </Link>
          </div>
        )}
      </section>

      {tiersLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        tiers.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-base font-bold text-paper">
              پله‌های تخفیف
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier, i) => {
                const isCurrent = i === currentTierIndex;
                return (
                  <li
                    key={tier._id || tier.minOrderAmount}
                    className={`relative rounded-xl border p-4 ${
                      isCurrent
                        ? "border-bronze/60 bg-bronze/5"
                        : "border-line bg-card"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute left-3 top-3 rounded-full bg-bronze px-2 py-0.5 text-[10px] font-medium text-ink">
                        تخفیف فعلی شما
                      </span>
                    )}
                    <p className="font-display text-3xl font-bold text-bronze">
                      {toPersianDigits(tier.discountPercent)}٪
                    </p>
                    <p className="mt-1 text-xs text-muted">تخفیف سفارش بعدی</p>
                    <p className="mt-3 border-t border-line pt-3 text-sm text-paper">
                      جمع کالاها از {formatToman(tier.minOrderAmount)} به بالا
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )
      )}

      <section>
        <h2 className="mb-4 font-display text-base font-bold text-paper">
          چطور کار می‌کند؟
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-line bg-card p-4"
            >
              <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full border border-bronze/40 text-xs font-medium text-bronze">
                {toPersianDigits(i + 1)}
              </span>
              <p className="text-sm font-medium text-paper">{step.title}</p>
              <p className="mt-1.5 text-xs leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs leading-6 text-muted">
          تخفیف وفاداری با کد تخفیف هم‌زمان استفاده نمی‌شود. اگر کد تخفیف وارد
          کنید، فقط کد اعمال می‌شود.
        </p>
      </section>
    </div>
  );
};

export default LoyaltyTab;
