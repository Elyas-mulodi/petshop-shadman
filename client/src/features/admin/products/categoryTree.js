// دسته‌های flat (با parent پر شده) ← درخت
export const buildCategoryTree = (flat) => {
  const nodes = new Map(
    flat.map((c) => [
      c._id,
      { ...c, parentId: c.parent?._id ?? c.parent ?? null, children: [] },
    ]),
  );
  const roots = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
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

// نقشه‌ی شناسه ← گره
export const indexTree = (roots) => {
  const map = new Map();
  const walk = (nodes) =>
    nodes.forEach((node) => {
      map.set(node._id, node);
      walk(node.children);
    });
  walk(roots);
  return map;
};

// انتخاب یک دسته، والدهاش رو هم انتخاب می‌کنه؛ برداشتن یک دسته، زیردسته‌هاش رو هم برمی‌داره
export const toggleCategory = (selected, node, checked, index) => {
  const next = new Set(selected);

  if (checked) {
    for (
      let cur = node;
      cur;
      cur = cur.parentId ? index.get(cur.parentId) : null
    ) {
      next.add(cur._id);
    }
  } else {
    const stack = [node];
    while (stack.length) {
      const current = stack.pop();
      next.delete(current._id);
      stack.push(...current.children);
    }
  }

  return [...next];
};
