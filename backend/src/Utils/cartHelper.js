import Product from "../Modules/Product/ProductMd.js";

const MAX_QTY_PER_ITEM = 10;

// پیدا کردن محصول و واریانت مشخص، همراه با چک فعال بودن
export const findProductAndVariant = async (productId, variantId) => {
  const product = await Product.findOne({ _id: productId, isActive: true });

  if (!product) {
    return { error: "محصول یافت نشد یا غیرفعال است" };
  }

  const variant = product.variants.id(variantId);

  if (!variant) {
    return { error: "این واریانت از محصول یافت نشد" };
  }

  return { product, variant };
};

// محاسبه قیمت نهایی یک واریانت با در نظر گرفتن تخفیف فعال محصول
export const getVariantFinalPrice = (product, variant) => {
  const isDiscountActive = product.isDiscountActive();
  const finalPrice = isDiscountActive
    ? Math.round(variant.price - (variant.price * product.discountPercent) / 100)
    : variant.price;

  return { originalPrice: variant.price, finalPrice, discountPercent: isDiscountActive ? product.discountPercent : 0 };
};

// ساخت خروجی کامل سبد با قیمت‌های لحظه‌ای، حذف آیتم‌های نامعتبر
export const buildCartResponse = async (cart) => {
  const validItems = [];
  let subtotal = 0;
  let hadInvalidItems = false;

  for (const item of cart.items) {
    const { product, variant, error } = await findProductAndVariant(item.product, item.variantId);

    if (error) {
      hadInvalidItems = true;
      continue;
    }

    const { originalPrice, finalPrice, discountPercent } = getVariantFinalPrice(product, variant);
    const availableStock = variant.stock;
    const quantity = Math.min(item.quantity, availableStock, MAX_QTY_PER_ITEM);

    if (quantity <= 0) {
      hadInvalidItems = true;
      continue;
    }

    const lineTotal = finalPrice * quantity;
    subtotal += lineTotal;

    validItems.push({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      image: product.images[0] || null,
      variantId: variant._id,
      attributes: variant.attributes,
      quantity,
      availableStock,
      originalPrice,
      finalPrice,
      discountPercent,
      lineTotal,
    });
  }

  return {
    items: validItems,
    subtotal,
    itemsCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
    hadInvalidItems, // اگه true بود یعنی بعضی آیتم‌ها (محصول حذف‌شده/ناموجود) از سبد حذف شدن
  };
};

export const MAX_QTY = MAX_QTY_PER_ITEM;