import { PawPrint } from "lucide-react";
import { CountdownBoxes } from "./Countdown";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const DiscountHero = ({ stats }) => (
  <section className="relative overflow-hidden rounded-3xl border border-line bg-card">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--color-bronze) 20%, transparent), transparent 55%)",
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          "radial-gradient(var(--color-line) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage: "linear-gradient(to left, black, transparent 75%)",
        WebkitMaskImage: "linear-gradient(to left, black, transparent 75%)",
      }}
    />
    <PawPrint
      aria-hidden
      className="pointer-events-none absolute -bottom-10 -left-8 h-56 w-56 -rotate-12 text-paper/[0.03]"
      strokeWidth={1.1}
    />

    <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-paper md:text-3xl">
          تخفیف‌های ویژه
        </h1>

        <p className="mt-3 flex items-end gap-3 leading-none">
          <span className="pb-2 font-display text-2xl font-bold text-muted md:pb-4 md:text-4xl">
            تا
          </span>
          <span className="bg-gradient-to-b from-bronze to-bronze/15 bg-clip-text font-display text-[6rem] font-bold leading-[0.9] text-transparent md:text-[10rem]">
            {toPersianDigits(stats.maxPercent)}٪
          </span>
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-xs text-muted">محصول با تخفیف</dt>
            <dd className="mt-1 font-display text-xl font-bold text-paper">
              {toPersianDigits(stats.count)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">
              بیشترین صرفه‌جویی روی یک محصول
            </dt>
            <dd className="mt-1 font-display text-xl font-bold text-paper">
              {formatToman(stats.maxSaving)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-line bg-ink/60 p-5 backdrop-blur-sm">
        {stats.ending ? (
          <>
            <p className="text-sm text-paper">پایان نزدیک‌ترین تخفیف</p>
            <p className="mb-4 mt-1 truncate text-xs text-muted">
              {stats.ending.name}
            </p>
            <CountdownBoxes endDate={stats.ending.discountEndDate} />
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="font-display text-lg font-bold text-paper">
              فرصت خرید با تخفیف
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              تخفیف‌های فعلی محدودیت زمانی مشخصی ندارند، ولی تا اطلاع بعدی ادامه
              دارند.
            </p>
          </div>
        )}
      </div>
    </div>
  </section>
);

export default DiscountHero;
