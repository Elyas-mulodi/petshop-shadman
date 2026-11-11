import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { CountdownChip } from "./Countdown";
import { SORTERS, endMs, finalOf, minPriceOf } from "./dealMath";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const WINDOW_MS = 72 * 60 * 60 * 1000;

const EndingSoon = ({ products, now }) => {
  const soon = products
    .filter((p) => endMs(p) - now < WINDOW_MS)
    .sort(SORTERS.ending)
    .slice(0, 10);

  if (soon.length === 0) return null;

  return (
    <section aria-labelledby="ending-soon">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="ending-soon" className="font-display text-lg font-bold text-paper">
            رو به پایان
          </h2>
          <p className="mt-1 text-xs text-muted">تخفیف این محصولات تا ۷۲ ساعت آینده تمام می‌شود</p>
        </div>
      </div>

      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {soon.map((p) => {
          const image = getImageUrl(p.images?.[0]);
          return (
            <li key={p._id} className="w-72 shrink-0 snap-start">
              <Link
                to={`/products/${p.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3 transition-colors hover:border-bronze/50"
              >
                {image ? (
                  <img src={image} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-well">
                    <PawPrint className="h-6 w-6 text-sage" strokeWidth={1.3} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm leading-6 text-paper">{p.name}</p>
                    <span className="shrink-0 rounded-md bg-bronze px-1.5 py-0.5 font-display text-xs font-bold text-ink">
                      {toPersianDigits(p.discountPercent)}٪
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-bronze">
                    {formatToman(finalOf(minPriceOf(p), p.discountPercent))}
                  </p>
                  <CountdownChip endDate={p.discountEndDate} className="mt-1.5" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default EndingSoon;