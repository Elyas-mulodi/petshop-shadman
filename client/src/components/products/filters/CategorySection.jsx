import useCategoryTree from "../../../features/categories/useCategoryTree";

const CategorySection = ({ value, onChange }) => {
  const { categories } = useCategoryTree();

  return (
    <div className="flex flex-col gap-2.5">
      {categories.map((cat) => (
        <label key={cat._id} className="flex cursor-pointer items-center gap-2.5">
          <input
            type="radio"
            checked={value === cat._id}
            onChange={() => onChange(value === cat._id ? "" : cat._id)}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-sm text-muted">{cat.name}</span>
        </label>
      ))}
    </div>
  );
};

export default CategorySection;