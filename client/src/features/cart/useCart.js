import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCart, previewCart, updateCartItem, removeCartItem } from "./cartApi";
import { setServerCart, updateGuestCartItem, removeGuestCartItem, replaceGuestCart } from "./cartSlice";
import { parseApiError } from "../../utils/authHelpers";

const emptyCart = { items: [], subtotal: 0, itemsCount: 0 };

const recalc = (items) => ({
  items,
  subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
  itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
});

const useCart = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
  const { guestItems, serverCart } = useSelector((state) => state.cart);

  const [guestCart, setGuestCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [prunedNotice, setPrunedNotice] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!authChecked) return;

    let active = true;
    setError(null);

    const fail = () => active && setError("دریافت سبد خرید با خطا مواجه شد");
    const finish = () => active && setLoading(false);

    if (isAuthenticated) {
      getCart()
        .then((res) => {
          if (!active) return;
          dispatch(setServerCart(res.data.data));
          if (res.data.data.hadInvalidItems) setPrunedNotice(true);
        })
        .catch(fail)
        .finally(finish);
    } else if (guestItems.length === 0) {
      setGuestCart(emptyCart);
      setLoading(false);
    } else {
      previewCart(guestItems)
        .then((res) => {
          if (!active) return;
          const data = res.data.data;
          setGuestCart(data);

          // آیتم‌های حذف‌شده/ناموجود رو از localStorage هم پاک کن
          if (data.hadInvalidItems) {
            setPrunedNotice(true);
            dispatch(
              replaceGuestCart(
                data.items.map((i) => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: i.quantity,
                }))
              )
            );
          }
        })
        .catch(fail)
        .finally(finish);
    }

    return () => {
      active = false;
    };
  }, [authChecked, isAuthenticated, guestItems, reloadKey, dispatch]);

  const updateQuantity = async (variantId, quantity) => {
    setActionError("");

    if (!isAuthenticated) {
      // به‌روزرسانی خوش‌بینانه: بلافاصله روی صفحه اعمال می‌شه، بعد پیش‌نمایش دوباره تایید می‌کنه
      setGuestCart((prev) =>
        prev
          ? recalc(
              prev.items.map((i) =>
                i.variantId === variantId ? { ...i, quantity, lineTotal: i.finalPrice * quantity } : i
              )
            )
          : prev
      );
      dispatch(updateGuestCartItem({ variantId, quantity }));
      return;
    }

    setBusyId(variantId);
    try {
      const res = await updateCartItem(variantId, quantity);
      dispatch(setServerCart(res.data.data));
    } catch (err) {
      setActionError(parseApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (variantId) => {
    setActionError("");

    if (!isAuthenticated) {
      setGuestCart((prev) => (prev ? recalc(prev.items.filter((i) => i.variantId !== variantId)) : prev));
      dispatch(removeGuestCartItem(variantId));
      return;
    }

    setBusyId(variantId);
    try {
      const res = await removeCartItem(variantId);
      dispatch(setServerCart(res.data.data));
    } catch (err) {
      setActionError(parseApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const retry = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const cart = isAuthenticated ? serverCart : guestCart;

  return {
    cart,
    showSkeleton: loading && !cart,
    error,
    actionError,
    busyId,
    prunedNotice,
    updateQuantity,
    remove,
    retry,
  };
};

export default useCart;