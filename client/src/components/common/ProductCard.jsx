import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman, getProductPricing } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const ProductCard = ({ product }) => {
  const image = getImageUrl(product.images?.[0]);
  const { basePrice, finalPrice, hasDiscount, discountPercent } = getProductPricing(product);

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:border-bronze/50 focus-visible:border-bronze focus-visible:outline-none md:hover:-translate-y-0.5 md:hover:shadow-lg md:hover:shadow-black/20"
    >
      {/* تصویر */}
      <div className="relative aspect-square shrink-0 overflow-hidden bg-well">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-[1.05]"
          />
        ) : (
          <span className="flex h-full items-center justify-center bg-gradient-to-br from-bronze/10 via-well to-sage/10">
            <PawPrint className="h-10 w-10 text-sage/70" strokeWidth={1.3} />
          </span>
        )}

        {hasDiscount && (
          <span className="absolute start-2 top-2 rounded-full bg-bronze px-2 py-0.5 text-[11px] font-bold leading-5 text-ink shadow-sm sm:px-2.5 sm:text-xs">
            {toPersianDigits(discountPercent)}٪<span className="hidden sm:inline"> تخفیف</span>
          </span>
        )}
      </div>

      {/* اطلاعات: قد همه‌ی کارت‌های یک ردیف یکسانه و قیمت همیشه پایین کارت می‌چسبه */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand?.name && (
          <p className="mb-1 truncate text-[11px] text-muted sm:text-xs">{product.brand.name}</p>
        )}

        <h3 className="line-clamp-2 min-h-10 text-[13px] leading-5 text-paper sm:min-h-12 sm:text-sm sm:leading-6">
          {product.name}
        </h3>

        <div className="mt-auto flex flex-col gap-0.5 pt-2.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
          <span className="text-sm font-bold text-bronze sm:text-base">{formatToman(finalPrice)}</span>
          {hasDiscount && (
            <span className="text-[11px] text-muted line-through sm:text-xs">{formatToman(basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;