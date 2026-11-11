import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gift, Ticket, Truck } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { getShippingConfig } from "../../features/orders/ordersApi";
import { getLoyaltyTiers } from "../../features/loyalty/loyaltyApi";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const percentText = (value) => toPersianDigits(String(value).replace(".", "٫"));

const compact = (value) => {
  if (value >= 1e6) return `${toPersianDigits(Number((value / 1e6).toFixed(1)).toString().replace(".", "٫"))} م`;
  if (value >= 1e3) return `${toPersianDigits(Math.round(value / 1e3))} هزار`;
  return toPersianDigits(value);
};

const PerkCard = ({ icon: Icon, title, children, action }) => (
  <div className="relative overflow-hidden rounded-2xl border border-line bg-card p-5">
    <span aria-hidden className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-line bg-ink" />
    <span aria-hidden className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-line bg-ink" />
    <Icon className="mb-3 h-6 w-6 text-bronze" strokeWidth={1.5} />
    <h3 className="font-display text-base font-bold text-paper">{title}</h3>
    <p className="mt-2 text-sm leading-7 text-muted">{children}</p>
    {action}
  </div>
);

// ---------- نردبان باشگاه مشتریان ----------
const LoyaltyLadder = ({ tiers }) => {
  const sorted = useMemo(() => [...tiers].sort((a, b) => a.minOrderAmount - b.minOrderAmount), [tiers]);
  const top = sorted[sorted.length - 1];
  const sliderMax = Math.max(100_000, Math.ceil((top.minOrderAmount * 1.35) / 100_000) * 100_000);
  const maxPercent = Math.max(...sorted.map((t) => t.discountPercent));

  const [amount, setAmount] = useState(0);

  const current = [...sorted].reverse().find((t) => t.minOrderAmount <= amount) ?? null;
  const next = sorted.find((t) => t.minOrderAmount > amount) ?? null;

  return (
    <section aria-labelledby="loyalty-ladder" className="rounded-3xl border border-line bg-card p-6 md:p-8">
      <h2 id="loyalty-ladder" className="font-display text-lg font-bold text-paper md:text-xl">
        هرچه بیشتر بخری، تخفیف سفارش بعدی بیشتر
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
        بعد از هر خرید، بر اساس مبلغ کالاهای سفارش، یک تخفیف برای خرید بعدی‌ات ثبت می‌شود و هنگام ثبت سفارش خودکار اعمال
        می‌شود. اسلایدر را حرکت بده و ببین چه پله‌ای می‌گیری.
      </p>

      <ul className="mt-8 flex h-44 items-end gap-2 sm:gap-3" aria-hidden>
        {sorted.map((tier) => {
          const reached = tier.minOrderAmount <= amount;
          const active = current?._id === tier._id;
          return (
            <li key={tier._id} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className={`text-xs font-bold ${active ? "text-bronze" : reached ? "text-paper" : "text-muted"}`}>
                {percentText(tier.discountPercent)}٪
              </span>
              <div
                className={`w-full rounded-t-lg border transition-all duration-500 ${
                  active ? "border-bronze bg-bronze" : reached ? "border-bronze/40 bg-bronze/25" : "border-line bg-well"
                }`}
                style={{ height: `${28 + (tier.discountPercent / maxPercent) * 100}px` }}
              />
              <span className="text-[10px] text-muted">{compact(tier.minOrderAmount)}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <label htmlFor="ladder-range" className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">مبلغ خرید (جمع کالاها)</span>
          <span className="font-display font-bold text-paper">{formatToman(amount)}</span>
        </label>
        <input
          id="ladder-range"
          type="range"
          dir="rtl"
          min={0}
          max={sliderMax}
          step={50_000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-bronze"
        />
      </div>

      <p className="mt-5 min-h-[3.5rem] text-sm leading-7 text-paper" role="status">
        {current ? (
          <>
            با این مبلغ <span className="font-display text-lg font-bold text-bronze">{percentText(current.discountPercent)}٪</span>{" "}
            تخفیف برای سفارش بعدی‌ات ثبت می‌شود.
          </>
        ) : (
          "با این مبلغ هنوز به اولین پله نمی‌رسی."
        )}
        {next && (
          <span className="block text-xs text-muted">
            با {formatToman(next.minOrderAmount - amount)} خرید بیشتر به پله‌ی {percentText(next.discountPercent)}٪ می‌رسی.
          </span>
        )}
      </p>
    </section>
  );
};

const PerksSection = () => {
  const shipping = useFetch(() => getShippingConfig().then((res) => res.data.data));
  const loyalty = useFetch(() => getLoyaltyTiers().then((res) => res.data.data));

  const cost = shipping.data?.shippingCost ?? null;
  const threshold = shipping.data?.freeShippingThreshold ?? 0;
  const tiers = loyalty.data ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {cost === 0 ? (
          <PerkCard icon={Truck} title="ارسال رایگان">
            هزینه‌ی ارسال همه‌ی سفارش‌ها رایگان است.
          </PerkCard>
        ) : threshold > 0 ? (
          <PerkCard icon={Truck} title="ارسال رایگان">
            برای خرید {formatToman(threshold)} و بالاتر، هزینه‌ی ارسال را ما می‌پردازیم.
          </PerkCard>
        ) : null}

        <PerkCard
          icon={Ticket}
          title="کد تخفیف داری؟"
          action={
            <Link to="/cart" className="mt-4 inline-block text-sm font-medium text-bronze transition-opacity hover:opacity-80">
              رفتن به سبد خرید
            </Link>
          }
        >
          کدت را در مرحله‌ی سبد خرید وارد کن. کد تخفیف همراه تخفیف باشگاه مشتریان اعمال نمی‌شود و فقط یکی از آن‌ها، همان
          کد، حساب می‌شود.
        </PerkCard>

        {tiers.length > 0 && (
          <PerkCard icon={Gift} title="باشگاه مشتریان">
            با هر خرید موفق، برای سفارش بعدی‌ات تخفیف پلکانی می‌گیری؛ پایین‌تر ببین چقدر.
          </PerkCard>
        )}
      </div>

      {tiers.length > 0 && <LoyaltyLadder tiers={tiers} />}
    </div>
  );
};

export default PerksSection;