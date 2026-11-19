import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import axiosInstance from "./utils/axiosInstance";
import { setAccessToken, setCredentials, logout } from "./features/auth/authSlice";
import { getProfile } from "./features/auth/authApi";
import { setServerCart } from "./features/cart/cartSlice";
import { getCart } from "./features/cart/cartApi";

function App() {
  const dispatch = useDispatch();
  const started = useRef(false); 

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const checkAuth = async () => {
      try {
        const { data } = await axiosInstance.post("/auth/refresh-token");

        dispatch(setAccessToken(data.accessToken));

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
        dispatch(logout());
      }
    };

    checkAuth();
  }, [dispatch]);

  return <AppRoutes />;
}

export default App;