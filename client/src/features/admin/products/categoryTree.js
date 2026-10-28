// دسته‌های flat (با parent پر شده) ← درخت
export const buildCategoryTree = (flat) => {
  const nodes = new Map(flat.map((c) => [c._id, { ...c, children: [] }]));
  const roots = [];

  for (const node of nodes.values()) {
    const parentId = node.parent?._id ?? node.parent ?? null;
    const parent = parentId ? nodes.get(parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
};

// برای select: والد و بعد فرزندهاش با عمق
export const flattenTree = (roots, depth = 0) =>
  roots.flatMap((node) => [
    { _id: node._id, name: node.name, depth, isActive: node.isActive },
    ...flattenTree(node.children, depth + 1),
  ]);