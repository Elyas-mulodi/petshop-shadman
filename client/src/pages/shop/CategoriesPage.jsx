import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { PawPrint } from "lucide-react";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { getImageUrl } from "../../utils/imageUrl";

const ease = [0.22, 1, 0.36, 1];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const card = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const CategoriesPage = () => {
  const { categories, loading } = useCategoryTree();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="mb-10 font-display text-4xl font-bold text-paper">دسته‌بندی‌ها</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-muted">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
      ) : (
        <motion.div
          variants={grid}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((cat) => {
            const image = getImageUrl(cat.image);

            return (
              <motion.div
                key={cat._id}
                variants={card}
                className="group overflow-hidden rounded-xl border border-line bg-card"
              >
                <Link
                  to={`/products?category=${cat._id}`}
                  className="block aspect-[4/3] overflow-hidden bg-well"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <PawPrint className="h-10 w-10 text-sage" strokeWidth={1.4} />
                    </span>
                  )}
                </Link>

                <div className="p-5">
                  <Link
                    to={`/products?category=${cat._id}`}
                    className="font-display text-xl font-bold text-paper transition-colors hover:text-bronze"
                  >
                    {cat.name}
                  </Link>

                  {cat.children?.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                      {cat.children.map((child) => (
                        <li key={child._id}>
                          <Link
                            to={`/products?category=${child._id}`}
                            className="text-sm text-paper transition-colors hover:text-bronze"
                          >
                            {child.name}
                          </Link>
                          {child.children?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                              {child.children.map((sub) => (
                                <Link
                                  key={sub._id}
                                  to={`/products?category=${sub._id}`}
                                  className="text-xs text-muted transition-colors hover:text-bronze"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default CategoriesPage;