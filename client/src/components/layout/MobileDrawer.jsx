import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Search, ChevronDown, User, LayoutDashboard } from "lucide-react";
import Logo from "../common/Logo";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { navLinks } from "../../utils/navLinks";

const ease = [0.22, 1, 0.36, 1];

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
};

const MobileDrawer = ({ open, onClose, isAuthenticated, user }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const navigate = useNavigate();
  const { categories } = useCategoryTree();

  // قفل اسکرول صفحه و بستن با Escape وقتی کشو بازه
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      onClose();
    }
  };

  // با portal به body منتقل می‌شه، چون backdrop-blur هدر باعث می‌شد position: fixed نسبت به هدر حساب بشه، نه صفحه
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm"
        />
      )}
      {open && (
        <motion.aside
          key="drawer"
          role="dialog"
          aria-modal="true"
          aria-label="منوی سایت"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease }}
          className="fixed inset-y-0 right-0 z-[70] flex w-[86%] max-w-sm flex-col border-l border-line bg-card"
        >
          <div className="flex items-center justify-between border-b border-line p-5">
            <Logo />
            <button
              onClick={onClose}
              aria-label="بستن منو"
              className="text-paper"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <form onSubmit={handleSearchSubmit} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="w-full rounded-lg border border-line bg-ink py-2.5 pr-10 pl-4 text-sm text-paper placeholder:text-muted focus:border-sage focus:outline-none"
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
              </div>
            </form>

            <motion.nav variants={list} initial="hidden" animate="show">
              {navLinks.map((link) =>
                link.hasMenu ? (
                  <motion.div
                    key={link.to}
                    variants={item}
                    className="border-b border-line"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        to={link.to}
                        onClick={onClose}
                        className="flex-1 py-4 font-display text-2xl font-bold text-paper"
                      >
                        {link.label}
                      </Link>
                      <button
                        onClick={() => setCatOpen((prev) => !prev)}
                        aria-expanded={catOpen}
                        aria-label="نمایش زیرمجموعه دسته‌بندی‌ها"
                        className="p-2 text-muted"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${catOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {catOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <ul className="flex flex-col gap-4 pb-5">
                            {categories.map((cat) => (
                              <li key={cat._id}>
                                <Link
                                  to={`/products?category=${cat._id}`}
                                  onClick={onClose}
                                  className="text-base text-paper hover:text-bronze"
                                >
                                  {cat.name}
                                </Link>
                                {cat.children?.length > 0 && (
                                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                    {cat.children.map((child) => (
                                      <Link
                                        key={child._id}
                                        to={`/products?category=${child._id}`}
                                        onClick={onClose}
                                        className="text-sm text-muted hover:text-bronze"
                                      >
                                        {child.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key={link.to}
                    variants={item}
                    className="border-b border-line"
                  >
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className="block py-4 font-display text-2xl font-bold text-paper"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ),
              )}
            </motion.nav>
          </div>

          <div className="border-t border-line p-5">
            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={onClose}
                className="mb-4 flex items-center gap-3 text-sm text-bronze"
              >
                <LayoutDashboard className="h-5 w-5" />
                پنل مدیریت
              </Link>
            )}
            <Link
              to={isAuthenticated ? "/profile" : "/login"}
              onClick={onClose}
              className="flex items-center gap-3 text-sm text-paper"
            >
              <User className="h-5 w-5 text-sage" />
              {isAuthenticated ? user?.name || "حساب من" : "ورود / ثبت‌نام"}
            </Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default MobileDrawer;
