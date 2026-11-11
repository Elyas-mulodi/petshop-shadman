import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { PawPrint } from "lucide-react";
import { CountdownChip, TimeProgress } from "./Countdown";
import { endMs, finalOf, inStock, maxSaving, minPriceOf, startMs } from "./dealMath";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const DiscountCard = ({ product, index = 0 }) => {
  const image = getImageUrl(product.images?.[0]);
  const base = minPriceOf(product);
  const final = finalOf(base, product.discountPercent);
  const prices = product.variants.map((v) => v.price);
  const hasRange = Math.min(...prices) !== Math.max(...prices);
  const available = inStock(product);
  const end = endMs(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/products/${product.slug}`}
        className={`group relative block overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-bronze/50 ${
          available ? "" : "opacity-75"
        }`}
      >
        <div className="relative aspect-square overflow-hidden bg-well">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full items-center justify-center">
              <PawPrint className="h-10 w-10 text-sage" strokeWidth={1.3} />
            </span>
          )}

          {/* مهر درصد تخفیف */}
          <div className="absolute right-3 top-3 -rotate-6 rounded-xl border border-ink/20 bg-bronze px-3 py-1.5 text-center text-ink shadow-lg">
            <p className="font-display text-xl font-bold leading-none">{toPersianDigits(product.discountPercent)}٪</p>
            <p className="mt-0.5 text-[10px] font-medium leading-none">تخفیف</p>
          </div>

          {!available && (
            <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-3 py-1 text-xs text-muted backdrop-blur">
              ناموجود
            </span>
          )}
        </div>

        {/* خط سوراخ‌دار بلیت */}
        <div className="relative">
          <div className="mx-5 border-t border-dashed border-line" />
          <span aria-hidden className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-line bg-ink" />
          <span aria-hidden className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-line bg-ink" />
        </div>

        <div className="p-4 pt-3.5">
          {product.brand?.name && <p className="mb-1 text-xs text-muted">{product.brand.name}</p>}
          <p className="line-clamp-2 min-h-[2.75rem] text-sm leading-[1.4rem] text-paper">{product.name}</p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-bronze">
              {hasRange && <span className="ml-1 text-xs font-normal text-muted">از</span>}
              {formatToman(final)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted line-through">{formatToman(base)}</p>

          <p className="mt-2 text-xs text-sage">صرفه‌جویی تا {formatToman(maxSaving(product))}</p>

          <div className="mt-4 space-y-2 border-t border-line pt-3">
            {Number.isFinite(end) ? (
              <>
                <CountdownChip endDate={product.discountEndDate} />
                <TimeProgress startMs={startMs(product)} endMs={end} />
              </>
            ) : (
              <span className="text-xs text-muted">تخفیف تا اطلاع بعدی</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default DiscountCard;