import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "./authSlice";
import { setServerCart, clearGuestCart } from "../cart/cartSlice";
import { syncCart, getCart } from "../cart/cartApi";

const useAuthSuccess = () => {
  const dispatch = useDispatch();
  const guestItems = useSelector((state) => state.cart.guestItems);

  return async ({ accessToken, user }) => {
    dispatch(setCredentials({ accessToken, user }));

    try {
      const hasGuestItems = guestItems.length > 0;
      const res = hasGuestItems ? await syncCart(guestItems) : await getCart();
      dispatch(setServerCart(res.data.data));
      if (hasGuestItems) dispatch(clearGuestCart());
    } catch {
    }
  };
};

export default useAuthSuccess;