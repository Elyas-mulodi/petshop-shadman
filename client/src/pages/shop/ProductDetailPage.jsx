import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import ImageGallery from "../../components/products/ImageGallery";
import VariantSelector from "../../components/products/VariantSelector";
import QuantitySelector from "../../components/products/QuantitySelector";
import Breadcrumb from "../../components/products/Breadcrumb";
import Accordion from "../../components/common/Accordion";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import useAddToCart from "../../features/cart/useAddToCart";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { getProductBySlug } from "../../features/products/productsApi";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";
import { findCategoryPath } from "../../utils/categoryHelpers";
import { formatAttributes, findMatchingVariant, getAttributeGroups } from "../../utils/variantHelpers";

const ease = [0.22, 1, 0.36, 1];

const PAGE = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";

// محتوای دکمه‌ی افزودن به سبد؛ هم توی نوار پایین موبایل استفاده میشه هم توی دسکتاپ
const AddLabel = ({ added, noVariant, soldOut }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={added ? "added" : noVariant ? "pick" : soldOut ? "sold" : "add"}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-center justify-center gap-2"
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          افزوده شد
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {noVariant ? "گزینه را انتخاب کنید" : soldOut ? "ناموجود" : "افزودن به سبد"}
        </>
      )}
    </motion.span>
  </AnimatePresence>
);

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { categories } = useCategoryTree();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { add, loading: adding, error: addError } = useAddToCart();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setSelections({});
    setQuantity(1);
    setAdded(false);

    getProductBySlug(slug)
      .then((res) => {
        if (!active) return;
        const data = res.data.data;
        setProduct(data);

        if (data.variants.length === 1) {
          const only = {};
          data.variants[0].attributes.forEach((a) => (only[a.name] = a.value));
          setSelections(only);
        }
      })
      .catch(() => active && setError("محصول مورد نظر یافت نشد یا خطایی رخ داد"))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className={`${PAGE} py-6 sm:py-10`}>
        <Skeleton className="mb-5 h-4 w-56 max-w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${PAGE} py-16`}>
        <ErrorState message={error} />
      </div>
    );
  }

  const groups = getAttributeGroups(product.variants);
  const selectedVariant = findMatchingVariant(product.variants, selections, groups.length);

  const isDiscountActive = product.discountPercent > 0;
  const basePrice = selectedVariant?.price ?? null;
  const finalPrice =
    basePrice && isDiscountActive
      ? Math.round(basePrice - (basePrice * product.discountPercent) / 100)
      : basePrice;
  const saving = basePrice && isDiscountActive ? basePrice - finalPrice : 0;

  const soldOut = Boolean(selectedVariant) && selectedVariant.stock === 0;
  const cannotAdd = !selectedVariant || soldOut || adding;

  const leafCategoryId = product.categories?.[0]?._id;
  const categoryPath = leafCategoryId ? findCategoryPath(categories, leafCategoryId) || [] : [];
  const breadcrumbItems = categoryPath.map((cat) => ({
    label: cat.name,
    to: `/products?category=${cat._id}`,
  }));

  const handleSelect = (name, value) => {
    setAdded(false);
    setSelections((prev) => ({ ...prev, [name]: value }));
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    const ok = await add({ productId: product._id, variantId: selectedVariant._id, quantity });
    if (ok) setAdded(true);
  };

  const accordionItems = [
    {
      title: "توضیحات",
      content: <p className="text-sm leading-7 text-muted">{product.description}</p>,
    },
    {
      title: "مشخصات",
      content: (
        <dl className="flex flex-col gap-2.5">
          {product.brand?.name && (
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5 text-sm">
              <dt className="shrink-0 text-muted">برند</dt>
              <dd className="text-paper">{product.brand.name}</dd>
            </div>
          )}
          {product.categories?.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5 text-sm">
              <dt className="shrink-0 text-muted">دسته‌بندی</dt>
              <dd className="text-end text-paper">{product.categories.map((c) => c.name).join("، ")}</dd>
            </div>
          )}
          {selectedVariant?.attributes.map((attr) => (
            <div key={attr.name} className="flex items-center justify-between gap-4 border-b border-line pb-2.5 text-sm last:border-b-0">
              <dt className="shrink-0 text-muted">{attr.name}</dt>
              <dd className="text-paper">{toPersianDigits(attr.value)}</dd>
            </div>
          ))}
        </dl>
      ),
    },
  ];

  const buttonClass =
    "flex items-center justify-center rounded-full bg-bronze py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40";

  return (
    <div className={`${PAGE} py-5 sm:py-8 lg:py-12`}>
      <Breadcrumb items={[...breadcrumbItems, { label: product.name }]} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
        {/* گالری: روی دسکتاپ هنگام اسکرول می‌چسبه */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ImageGallery images={product.images} alt={product.name} discountPercent={product.discountPercent} />
        </div>

        <div className="min-w-0">
          {product.brand?.name && (
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs text-sage">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
              {product.brand.name}
            </p>
          )}
          <h1 className="font-display text-xl font-bold leading-snug text-paper sm:text-2xl lg:text-3xl">
            {product.name}
          </h1>

          {/* قیمت */}
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-bronze/[0.10] to-card p-4 sm:p-5">
            {basePrice ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-2xl font-bold text-bronze sm:text-3xl">{formatToman(finalPrice)}</span>
                {isDiscountActive && (
                  <>
                    <span className="text-sm text-muted line-through">{formatToman(basePrice)}</span>
                    <span className="rounded-full bg-bronze px-2.5 py-0.5 text-xs font-bold text-ink">
                      {toPersianDigits(product.discountPercent)}٪ تخفیف
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">برای دیدن قیمت، یک گزینه را انتخاب کنید</p>
            )}

            {saving > 0 && (
              <p className="mt-2 text-xs text-sage">شما {formatToman(saving)} صرفه‌جویی می‌کنید</p>
            )}
          </div>

          {/* گزینه‌ها */}
          <div className="mt-4 rounded-2xl border border-line bg-card/60 p-4 sm:p-5">
            <VariantSelector variants={product.variants} selections={selections} onSelect={handleSelect} />

            {selectedVariant && (
              <p
                className={`mt-4 inline-flex items-center gap-2 text-xs ${
                  selectedVariant.stock > 0 ? "text-sage" : "text-danger"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${selectedVariant.stock > 0 ? "bg-sage" : "bg-danger"}`}
                />
                {selectedVariant.stock > 0
                  ? `موجود (${toPersianDigits(selectedVariant.stock)} عدد)`
                  : "ناموجود"}
              </p>
            )}
          </div>

          {/* تعداد + دکمه (دکمه فقط روی دسکتاپ؛ موبایل توی نوار پایین) */}
          <div className="mt-4 flex items-center gap-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={Math.min(10, selectedVariant?.stock || 10)}
            />

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cannotAdd}
              className={`${buttonClass} hidden flex-1 lg:flex`}
            >
              <AddLabel added={added} noVariant={!selectedVariant} soldOut={soldOut} />
            </button>
          </div>

          {addError && <p className="mt-3 text-xs text-danger">{addError}</p>}

          {added && (
            <Link
              to="/cart"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-bronze/40 px-4 py-1.5 text-xs text-bronze transition-colors hover:bg-bronze/10"
            >
              مشاهده سبد خرید
            </Link>
          )}

          {selectedVariant && (
            <p className="mt-4 text-xs leading-6 text-muted">
              مشخصات انتخاب‌شده: {formatAttributes(selectedVariant.attributes)}
            </p>
          )}

          {/* اطمینان خاطر */}
          <ul className="mt-5 grid grid-cols-2 gap-2">
            <li className="flex items-center gap-2 rounded-xl border border-line bg-card/60 px-3 py-2.5 text-xs text-muted">
              <Truck className="h-4 w-4 shrink-0 text-bronze" strokeWidth={1.6} />
              ارسال سریع
            </li>
            <li className="flex items-center gap-2 rounded-xl border border-line bg-card/60 px-3 py-2.5 text-xs text-muted">
              <ShieldCheck className="h-4 w-4 shrink-0 text-sage" strokeWidth={1.6} />
              ضمانت اصالت کالا
            </li>
          </ul>

          <div className="mt-6 sm:mt-8">
            <Accordion items={accordionItems} />
          </div>
        </div>
      </div>

      {/* نوار خرید موبایل و تبلت: sticky، یعنی پایین صفحه می‌چسبه ولی آخر محتوا تموم میشه
          و روی فوتر نمی‌افته (نیازی به فاصله‌ی اضافه‌ی پایین صفحه هم نیست) */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-line bg-card/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 shrink-0">
            {basePrice ? (
              <>
                <p className="text-base font-bold leading-6 text-bronze">{formatToman(finalPrice)}</p>
                {isDiscountActive && (
                  <p className="text-[11px] leading-4 text-muted line-through">{formatToman(basePrice)}</p>
                )}
              </>
            ) : (
              <p className="max-w-[7rem] text-[11px] leading-4 text-muted">گزینه را انتخاب کنید</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={cannotAdd}
            className={`${buttonClass} min-w-0 flex-1`}
          >
            <AddLabel added={added} noVariant={!selectedVariant} soldOut={soldOut} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;