import { useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { ShoppingBag, User, Menu, Search, ChevronDown, LayoutDashboard, X } from "lucide-react";
import Logo from "../common/Logo";
import MegaMenu from "./MegaMenu";
import MobileDrawer from "./MobileDrawer";
import { navLinks } from "../../utils/navLinks";

const ease = [0.22, 1, 0.36, 1];

// ناحیه‌ی لمس حداقل ~۴۰ پیکسل برای آیکون‌های موبایل، بدون اینکه چیدمان جابه‌جا بشه
const iconButton =
  "-m-2 flex items-center justify-center rounded-full p-2 text-paper transition-colors hover:text-bronze focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze/50";

const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // جستجوی موبایل و تبلت
  const [searchTerm, setSearchTerm] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 12));

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { guestItems, serverCart } = useSelector((state) => state.cart);

  const cartCount = isAuthenticated
    ? serverCart?.itemsCount || 0
    : guestItems.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  // تاخیر کوتاه موقع بستن، تا موس بتونه از لینک به پنل برسه بدون اینکه منو بسته بشه
  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const closeMega = () => {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 150);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setSearchOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-line bg-ink/85 backdrop-blur-md"
          : "border-transparent bg-ink"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center gap-3 px-4 transition-[padding] duration-300 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8 ${
          scrolled ? "py-2" : "py-3 sm:py-4"
        }`}
      >
        <Link to="/" className="shrink-0" aria-label="پت شاپ شادمان، صفحه اصلی">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 md:flex lg:gap-8">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            const linkClass = `relative flex items-center gap-1 whitespace-nowrap py-1 text-sm transition-colors ${
              active ? "text-paper" : "text-muted hover:text-paper"
            }`;
            const underline = active && (
              <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-0 -bottom-0.5 h-px bg-bronze"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            );

            if (!link.hasMenu) {
              return (
                <Link key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                  {underline}
                </Link>
              );
            }

            return (
              <div
                key={link.to}
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
                onFocus={openMega}
                onBlur={(e) => {
                  // با کیبورد: وقتی فوکوس کاملاً از این بخش بیرون رفت، منو بسته میشه
                  if (!e.currentTarget.contains(e.relatedTarget)) closeMega();
                }}
                onKeyDown={(e) => e.key === "Escape" && setMegaOpen(false)}
              >
                <Link
                  to={link.to}
                  className={linkClass}
                  aria-haspopup="true"
                  aria-expanded={megaOpen}
                >
                  {link.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                  />
                  {underline}
                </Link>
                <AnimatePresence>
                  {megaOpen && (
                    <MegaMenu onNavigate={() => setMegaOpen(false)} />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* جستجوی دسکتاپ */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="mx-auto hidden max-w-sm flex-1 lg:flex"
        >
          <div className="relative w-full">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی محصول..."
              aria-label="جستجوی محصول"
              className="w-full rounded-full border border-line bg-card py-2 pr-10 pl-4 text-sm text-paper transition-colors placeholder:text-muted focus:border-sage focus:outline-none"
            />
            <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
          </div>
        </form>

        <div className="mr-auto flex items-center gap-4 sm:gap-5 lg:mr-0">
          {isAuthenticated && user?.role === "admin" && (
            <Link
              to="/admin"
              aria-label="پنل مدیریت"
              title="پنل مدیریت"
              className="hidden items-center gap-1.5 whitespace-nowrap text-sm text-bronze transition-opacity hover:opacity-80 md:flex"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden lg:inline">پنل مدیریت</span>
            </Link>
          )}

          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            aria-label={isAuthenticated ? "حساب کاربری" : "ورود"}
            title={isAuthenticated ? "حساب کاربری" : "ورود"}
            className="hidden items-center gap-1.5 text-sm text-muted transition-colors hover:text-paper md:flex"
          >
            <User className="h-5 w-5 shrink-0" />
            <span className="hidden max-w-[8rem] truncate lg:inline">
              {isAuthenticated ? user?.name || "حساب من" : "ورود"}
            </span>
          </Link>

          {/* دکمه‌ی جستجو: موبایل و تبلت */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={`${iconButton} lg:hidden`}
            aria-label={searchOpen ? "بستن جستجو" : "جستجو"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-6 w-6" strokeWidth={1.6} /> : <Search className="h-6 w-6" strokeWidth={1.6} />}
          </button>

          <Link
            to="/cart"
            className={`${iconButton} relative`}
            aria-label={cartCount > 0 ? `سبد خرید، ${cartCount} کالا` : "سبد خرید"}
          >
            <motion.span
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.92 }}
              className="flex"
            >
              <ShoppingBag className="h-6 w-6" strokeWidth={1.6} />
            </motion.span>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1 text-xs font-medium text-ink"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`${iconButton} md:hidden`}
            aria-label="باز کردن منو"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* نوار جستجوی موبایل و تبلت: زیر هدر باز میشه */}
      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.form
            key="mobile-search"
            onSubmit={handleSearchSubmit}
            role="search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            className="overflow-hidden lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
              <div className="relative">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی محصول..."
                  aria-label="جستجوی محصول"
                  autoFocus
                  enterKeyHint="search"
                  className="w-full rounded-full border border-line bg-card py-2.5 pr-11 pl-4 text-base text-paper transition-colors placeholder:text-muted focus:border-sage focus:outline-none sm:text-sm"
                />
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
      />
    </motion.header>
  );
};

export default Header;