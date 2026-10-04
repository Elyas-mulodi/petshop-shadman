// گروه‌بندی ویژگی‌های واریانت‌ها (مثلاً "وزن" → ["1کیلوگرم","3کیلوگرم"], "طعم" → ["مرغ","ماهی"])
export const getAttributeGroups = (variants) => {
  const groups = new Map();

  variants.forEach((variant) => {
    variant.attributes.forEach(({ name, value }) => {
      if (!groups.has(name)) groups.set(name, []);
      if (!groups.get(name).includes(value)) groups.get(name).push(value);
    });
  });

  return Array.from(groups.entries()).map(([name, values]) => ({ name, values }));
};

// آیا حداقل یک واریانت با این مقدار + انتخاب‌های فعلی (برای بقیه ویژگی‌ها) وجود داره؟
export const isValueAvailable = (variants, selections, attrName, attrValue) => {
  const candidate = { ...selections, [attrName]: attrValue };
  return variants.some((variant) =>
    Object.entries(candidate).every(([name, value]) =>
      variant.attributes.some((a) => a.name === name && a.value === value)
    )
  );
};

// پیدا کردن واریانتی که دقیقاً با همه‌ی انتخاب‌ها مچه
export const findMatchingVariant = (variants, selections, totalGroups) => {
  if (Object.keys(selections).length !== totalGroups) return null;
  return variants.find((variant) =>
    Object.entries(selections).every(([name, value]) =>
      variant.attributes.some((a) => a.name === name && a.value === value)
    )
  );
};

export const formatAttributes = (attributes) => attributes.map((a) => a.value).join(" / ");