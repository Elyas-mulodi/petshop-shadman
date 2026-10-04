import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart as addToCartApi } from "./cartApi";
import { setServerCart, addToGuestCart } from "./cartSlice";
import { parseApiError } from "../../utils/authHelpers";

const useAddToCart = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const add = async ({ productId, variantId, quantity }) => {
    setError("");

    if (!isAuthenticated) {
      dispatch(addToGuestCart({ productId, variantId, quantity }));
      return true;
    }

    setLoading(true);
    try {
      const res = await addToCartApi(productId, variantId, quantity);
      dispatch(setServerCart(res.data.data));
      return true;
    } catch (err) {
      setError(parseApiError(err).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { add, loading, error };
};

export default useAddToCart;