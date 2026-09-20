import asyncHandler from "express-async-handler";
import Cart from "./CartMd.js";
import {
  findProductAndVariant,
  buildCartResponse,
  MAX_QTY,
} from "../../Utils/cartHelper.js";

// پیدا کردن یا ساختن سبد کاربر
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// ---------- دریافت سبد خرید با قیمت‌های لحظه‌ای ----------
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const result = await buildCartResponse(cart);

  res.status(200).json({ success: true, data: result });
});

// ---------- افزودن آیتم به سبد ----------
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body;

  const { product, variant, error } = await findProductAndVariant(productId, variantId);

  if (error) {
    res.status(404);
    throw new Error(error);
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find((i) => String(i.variantId) === variantId);
  const currentQty = existingItem ? existingItem.quantity : 0;
  const requestedTotalQty = currentQty + quantity;

  if (requestedTotalQty > variant.stock) {
    res.status(400);
    throw new Error(`موجودی کافی نیست. حداکثر موجودی: ${variant.stock} عدد`);
  }

  const finalQty = Math.min(requestedTotalQty, MAX_QTY);

  if (existingItem) {
    existingItem.quantity = finalQty;
  } else {
    cart.items.push({ product: productId, variantId, quantity: finalQty });
  }

  await cart.save();

  const result = await buildCartResponse(cart);
  res.status(200).json({ success: true, data: result });
});

// ---------- ویرایش تعداد یک آیتم ----------
export const updateCartItem = asyncHandler(async (req, res) => {
  const { variantId, quantity } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => String(i.variantId) === variantId);

  if (!item) {
    res.status(404);
    throw new Error("این آیتم در سبد خرید یافت نشد");
  }

  const { variant, error } = await findProductAndVariant(item.product, variantId);

  if (error) {
    res.status(404);
    throw new Error(error);
  }

  if (quantity > variant.stock) {
    res.status(400);
    throw new Error(`موجودی کافی نیست. حداکثر موجودی: ${variant.stock} عدد`);
  }

  item.quantity = quantity;
  await cart.save();

  const result = await buildCartResponse(cart);
  res.status(200).json({ success: true, data: result });
});

// ---------- حذف یک آیتم از سبد ----------
export const removeCartItem = asyncHandler(async (req, res) => {
  const { variantId } = req.body;

  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.variantId) !== variantId);
  await cart.save();

  const result = await buildCartResponse(cart);
  res.status(200).json({ success: true, data: result });
});

// ---------- خالی کردن کل سبد ----------
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  res.status(200).json({ success: true, data: { items: [], subtotal: 0, itemsCount: 0 } });
});

// ---------- سینک سبد مهمان (localStorage) با سبد سرور، موقع لاگین/ثبت‌نام ----------
export const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  const cart = await getOrCreateCart(req.user._id);

  for (const localItem of items) {
    const { variant, error } = await findProductAndVariant(localItem.productId, localItem.variantId);

    if (error) continue; // آیتم نامعتبر/حذف‌شده از سبد لوکال، نادیده گرفته میشه

    const existingItem = cart.items.find((i) => String(i.variantId) === localItem.variantId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const mergedQty = Math.min(currentQty + localItem.quantity, variant.stock, MAX_QTY);

    if (mergedQty <= 0) continue;

    if (existingItem) {
      existingItem.quantity = mergedQty;
    } else {
      cart.items.push({ product: localItem.productId, variantId: localItem.variantId, quantity: mergedQty });
    }
  }

  await cart.save();

  const result = await buildCartResponse(cart);
  res.status(200).json({ success: true, data: result });
});