import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import useCategoryTree from "../../features/categories/useCategoryTree";
import ErrorState from "../common/ErrorState";

const ease = [0.22, 1, 0.36, 1];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const column = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

const MegaMenu = ({ onNavigate }) => {
  const { categories, loading, error, retry } = useCategoryTree();
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease }}
      className="absolute inset-x-0 top-full border-b border-line bg-card"
    >
      <div className="mx-auto max-w-7xl px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-4 gap-8">
            2
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-well" />
            ))}
          </div>
        ) : error ? (
          <ErrorState compact message={error} onRetry={retry} />
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
        ) : (
          <motion.div
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4"
          >
            {categories.map((cat) => (
              <motion.div key={cat._id} variants={column}>
                <Link
                  to={`/products?category=${cat._id}`}
                  onClick={onNavigate}
                  className="mb-3 block font-display text-base font-bold text-paper transition-colors hover:text-bronze"
                >
                  {cat.name}
                </Link>
                <ul className="flex flex-col gap-2 border-t border-line pt-3">
                  {cat.children?.map((child) => (
                    <li key={child._id}>
                      <Link
                        to={`/products?category=${child._id}`}
                        onClick={onNavigate}
                        className="inline-block text-sm text-muted transition-all duration-200 hover:-translate-x-1 hover:text-bronze"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-8 border-t border-line pt-4">
          <Link
            to="/categories"
            onClick={onNavigate}
            className="inline-flex items-center gap-2 text-sm text-bronze"
          >
            مشاهده همه دسته‌بندی‌ها
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;
