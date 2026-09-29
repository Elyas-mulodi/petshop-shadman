import { useEffect } from "react";
import { useDispatch } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import axiosInstance from "./utils/axiosInstance";
import { setCredentials, authCheckFinished } from "./features/auth/authSlice";
import { getProfile } from "./features/auth/authApi";
import { setServerCart } from "./features/cart/cartSlice";
import { getCart } from "./features/cart/cartApi";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axiosInstance.post("/auth/refresh-token");
        const profileRes = await getProfile();

        dispatch(
          setCredentials({
            accessToken: data.accessToken,
            user: profileRes.data.data,
          }),
        );
        
        getCart()
          .then((res) => dispatch(setServerCart(res.data.data)))
          .catch(() => {});
      } catch {
        dispatch(authCheckFinished());
      }
    };

    checkAuth();
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;
