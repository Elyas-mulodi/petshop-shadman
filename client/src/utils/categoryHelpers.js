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