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
      className="group block overflow-hidden rounded-lg border border-line bg-card transition-colors hover:border-bronze/50"
    >
      <div className="relative aspect-square overflow-hidden bg-well">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <PawPrint className="h-8 w-8 text-sage" strokeWidth={1.4} />
          </span>
        )}

        {hasDiscount && (
          <span className="absolute right-2 top-2 rounded-md bg-bronze px-2 py-1 text-xs font-medium text-ink">
            {toPersianDigits(discountPercent)}٪ تخفیف
          </span>
        )}
      </div>

      <div className="p-3.5">
        {product.brand?.name && (
          <p className="mb-1 text-xs text-muted">{product.brand.name}</p>
        )}
        <p className="mb-2 line-clamp-2 text-sm text-paper">{product.name}</p>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bronze">{formatToman(finalPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted line-through">{formatToman(basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;