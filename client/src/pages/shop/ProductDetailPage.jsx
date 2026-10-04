import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
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
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
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
            <div className="flex items-center justify-between border-b border-line pb-2.5 text-sm">
              <dt className="text-muted">برند</dt>
              <dd className="text-paper">{product.brand.name}</dd>
            </div>
          )}
          {product.categories?.length > 0 && (
            <div className="flex items-center justify-between border-b border-line pb-2.5 text-sm">
              <dt className="text-muted">دسته‌بندی</dt>
              <dd className="text-paper">{product.categories.map((c) => c.name).join("، ")}</dd>
            </div>
          )}
          {selectedVariant?.attributes.map((attr) => (
            <div key={attr.name} className="flex items-center justify-between border-b border-line pb-2.5 text-sm last:border-b-0">
              <dt className="text-muted">{attr.name}</dt>
              <dd className="text-paper">{toPersianDigits(attr.value)}</dd>
            </div>
          ))}
        </dl>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
      <Breadcrumb items={[...breadcrumbItems, { label: product.name }]} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images} alt={product.name} discountPercent={product.discountPercent} />

        <div>
          {product.brand?.name && <p className="mb-2 text-sm text-sage">{product.brand.name}</p>}
          <h1 className="font-display text-2xl font-bold text-paper">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            {basePrice ? (
              <>
                <span className="text-xl font-bold text-bronze">{formatToman(finalPrice)}</span>
                {isDiscountActive && (
                  <span className="text-sm text-muted line-through">{formatToman(basePrice)}</span>
                )}
              </>
            ) : (
              <span className="text-sm text-muted">برای دیدن قیمت، یک گزینه را انتخاب کنید</span>
            )}
          </div>

          <div className="mt-6 border-t border-line pt-6">
            <VariantSelector variants={product.variants} selections={selections} onSelect={handleSelect} />
          </div>

          {selectedVariant && (
            <p className={`mt-4 text-xs ${selectedVariant.stock > 0 ? "text-sage" : "text-danger"}`}>
              {selectedVariant.stock > 0
                ? `موجود (${toPersianDigits(selectedVariant.stock)} عدد)`
                : "ناموجود"}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={Math.min(10, selectedVariant?.stock || 10)}
            />

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0 || adding}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-bronze py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <AnimatePresence mode="wait" initial={false}>
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    افزوده شد
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {!selectedVariant ? "ابتدا گزینه را انتخاب کنید" : "افزودن به سبد"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {addError && <p className="mt-3 text-xs text-danger">{addError}</p>}

          {added && (
            <Link to="/cart" className="mt-3 inline-block text-xs text-bronze hover:underline">
              مشاهده سبد خرید
            </Link>
          )}

          {selectedVariant && (
            <p className="mt-4 text-xs text-muted">
              مشخصات انتخاب‌شده: {formatAttributes(selectedVariant.attributes)}
            </p>
          )}

          <div className="mt-8">
            <Accordion items={accordionItems} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;