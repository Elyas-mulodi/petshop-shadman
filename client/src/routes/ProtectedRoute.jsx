import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, user, authChecked } = useSelector((state) => state.auth);

  if (!authChecked) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (adminOnly && user?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;