// جمع‌آوری id خود دسته + همه زیردسته‌ها (برای اینکه فیلتر دسته‌بندی، زیرمجموعه‌ها رو هم بگیره)
export const collectDescendantIds = (category) => {
  const ids = [category._id];
  (category.children || []).forEach((child) => ids.push(...collectDescendantIds(child)));
  return ids;
};

// پیدا کردن یک دسته (در هر عمقی) داخل درخت، بر اساس id
export const findCategoryById = (tree, id) => {
  for (const cat of tree) {
    if (cat._id === id) return cat;
    const found = findCategoryById(cat.children || [], id);
    if (found) return found;
  }
  return null;
};

// مسیر کامل از ریشه تا دسته موردنظر (برای breadcrumb) — خروجی: [دسته سطح۱, دسته سطح۲, ...]
export const findCategoryPath = (tree, id, path = []) => {
  for (const cat of tree) {
    const nextPath = [...path, cat];
    if (cat._id === id) return nextPath;
    const found = findCategoryPath(cat.children || [], id, nextPath);
    if (found) return found;
  }
  return null;
};