import { useMemo } from "react";
import Checkbox from "../ui/Checkbox";
import Badge from "../ui/Badge";
import {
  indexTree,
  toggleCategory,
} from "../../../features/admin/products/categoryTree";
import { toPersianDigits } from "../../../utils/authHelpers";

const CategoryPicker = ({ roots, value, onChange, error, loading }) => {
  const index = useMemo(() => indexTree(roots), [roots]);
  const selected = new Set(value);

  const renderNode = (node) => (
    <li key={node._id}>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-paper transition-colors hover:bg-well/50">
        <Checkbox
          checked={selected.has(node._id)}
          onChange={(checked) =>
            onChange(toggleCategory(value, node, checked, index))
          }
          label={node.name}
        />
        {node.name}
        {!node.isActive && <Badge>غیرفعال</Badge>}
      </label>
      {node.children.length > 0 && (
        <ul className="mr-5 border-r border-line pr-2">
          {node.children.map(renderNode)}
        </ul>
      )}
    </li>
  );

  return (
    <div className="mb-4">
      <span className="mb-1.5 block text-xs font-medium text-muted">
        دسته‌بندی‌ها
      </span>
      <div
        data-field="categories"
        tabIndex={-1}
        className={`max-h-64 overflow-y-auto rounded-lg border bg-ink p-2 ${error ? "border-danger" : "border-line"}`}
      >
        {loading ? (
          <div className="h-20 animate-pulse rounded-md bg-well" />
        ) : roots.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-6 text-muted">
            هنوز دسته‌بندی‌ای ساخته نشده است.
          </p>
        ) : (
          <ul>{roots.map(renderNode)}</ul>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-muted">
          {toPersianDigits(value.length)} دسته انتخاب شده. با انتخاب زیردسته،
          دسته‌ی والد هم خودکار انتخاب می‌شود.
        </p>
      )}
    </div>
  );
};

export default CategoryPicker;
