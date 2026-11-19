import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman, getProductPricing } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const ProductCard = ({ product }) => {
  const image = getImageUrl(product.images?.[0]);
  // عکس دوم (اگه باشه) روی دسکتاپ با هاور جایگزین عکس اول میشه
  const hoverImage = getImageUrl(product.images?.[1]);
  const { basePrice, finalPrice, hasDiscount, discountPercent } = getProductPricing(product);

  // فقط وقتی واریانت‌ها توی داده هستن و هیچ‌کدوم موجودی ندارن «ناموجود» حساب میشه
  const soldOut =
    Array.isArray(product.variants) &&
    product.variants.length > 0 &&
    product.variants.every((v) => !(v.stock > 0));

  return (
    <Link
      to={`/products/${product.slug}`}
      title={product.name}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:border-bronze/50 focus-visible:border-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze/40 md:hover:-translate-y-0.5 md:hover:shadow-lg md:hover:shadow-black/20"
    >
      {/* تصویر */}
      <div className="relative aspect-square shrink-0 overflow-hidden bg-well">
        {image ? (
          <>
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover transition-all duration-500 ease-out ${
                hoverImage ? "" : "md:group-hover:scale-[1.05]"
              } ${soldOut ? "opacity-60 grayscale" : ""}`}
            />
            {hoverImage && !soldOut && (
              <img
                src={hoverImage}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-500 md:block md:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span className="flex h-full items-center justify-center bg-gradient-to-br from-bronze/10 via-well to-sage/10">
            <PawPrint className="h-10 w-10 text-sage/70" strokeWidth={1.3} />
          </span>
        )}

        {/* لایه‌ی محو پایین عکس: جدا شدن نرم‌تر عکس از بخش اطلاعات */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-card/40 to-transparent" />

        {hasDiscount && !soldOut && (
          <span className="absolute start-2 top-2 rounded-full bg-bronze px-2 py-0.5 text-[11px] font-bold leading-5 text-ink shadow-sm sm:start-2.5 sm:top-2.5 sm:px-2.5 sm:text-xs">
            {toPersianDigits(discountPercent)}٪<span className="hidden sm:inline"> تخفیف</span>
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/80 px-3 py-1 text-center text-[11px] font-medium text-paper backdrop-blur sm:text-xs">
            ناموجود
          </span>
        )}
      </div>

      {/* اطلاعات: قد همه‌ی کارت‌های یک ردیف یکسانه و قیمت همیشه پایین کارت می‌چسبه */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5 lg:p-4">
        {product.brand?.name && (
          <p className="mb-1 truncate text-[11px] text-sage sm:text-xs">{product.brand.name}</p>
        )}

        <h3 className="line-clamp-2 min-h-10 text-[13px] font-medium leading-5 text-paper sm:min-h-12 sm:text-sm sm:leading-6">
          {product.name}
        </h3>

        <div className="mt-auto border-t border-line/60 pt-2.5 sm:pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={`text-sm font-bold sm:text-base ${soldOut ? "text-muted" : "text-bronze"}`}
            >
              {formatToman(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-muted line-through sm:text-xs">{formatToman(basePrice)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;