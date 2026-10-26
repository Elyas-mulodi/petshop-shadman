import { Suspense, useCallback, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, Menu, Store } from "lucide-react";
import AdminSidebar from "../components/admin/AdminSidebar";
import { ToastProvider } from "../components/admin/ui/ToastProvider";
import RouteErrorBoundary from "../components/common/RouteErrorBoundary";
import Skeleton from "../components/common/Skeleton";
import { queryClient } from "../features/admin/queryClient";
import { logout as logoutRequest } from "../features/auth/authApi";
import { logout as logoutAction } from "../features/auth/authSlice";
import { useOverlay } from "../hooks/useOverlay";

const ease = [0.22, 1, 0.36, 1];
const STORAGE_KEY = "admin:sidebar-collapsed";

const AdminFallback = () => (
  <div role="status" aria-label="در حال بارگذاری" className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-64" />
  </div>
);

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useOverlay(mobileOpen, closeMobile);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // حافظه‌ی مرورگر ممکنه بلاک باشه؛ فقط ماندگار نمی‌شه
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // حتی اگه درخواست به سرور نرسید، کاربر از مرورگر خودش خارج می‌شه
    }
    queryClient.clear(); // داده‌ی کش‌شده‌ی ادمین نباید برای کاربر بعدی بمونه
    navigate("/", { replace: true });
    dispatch(logoutAction());
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="flex min-h-screen bg-ink text-paper">
          <aside
            className={`sticky top-0 hidden h-screen shrink-0 border-l border-line bg-card transition-[width] duration-200 lg:block ${
              collapsed ? "w-[72px]" : "w-64"
            }`}
          >
            <AdminSidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur-md lg:px-8">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="باز کردن منو"
                className="text-paper lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="mr-auto flex items-center gap-4">
                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-1.5 text-sm text-muted transition-colors hover:text-paper sm:flex"
                >
                  <Store className="h-4 w-4" />
                  مشاهده سایت
                </Link>

                <div className="flex items-center gap-2 border-r border-line pr-4 text-sm">
                  <span className="max-w-[160px] truncate text-paper">{user?.name || "ادمین"}</span>
                  {user?.phone && (
                    <span dir="ltr" className="hidden text-xs text-muted md:inline">
                      {user.phone}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  aria-label="خروج از حساب"
                  title="خروج"
                  className="text-muted transition-colors hover:text-danger"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </header>

            <main className="flex-1 p-4 lg:p-8">
              <div className="mx-auto max-w-7xl">
                <RouteErrorBoundary key={location.pathname}>
                  <Suspense fallback={<AdminFallback />}>
                    <Outlet />
                  </Suspense>
                </RouteErrorBoundary>
              </div>
            </main>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="admin-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm lg:hidden"
            />
          )}
          {mobileOpen && (
            <motion.aside
              key="admin-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease }}
              className="fixed inset-y-0 right-0 z-50 w-72 border-l border-line bg-card lg:hidden"
            >
              <AdminSidebar onNavigate={closeMobile} onClose={closeMobile} />
            </motion.aside>
          )}
        </AnimatePresence>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default AdminLayout;