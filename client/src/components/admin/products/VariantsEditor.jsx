import { Copy, Plus, Trash2, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import {
  emptyAttribute,
  emptyVariant,
  toNumber,
  uid,
} from "../../../features/admin/products/productForm";
import { formatToman } from "../../../utils/price";
import { toPersianDigits } from "../../../utils/authHelpers";

const ErrorText = ({ children }) =>
  children ? <p className="mt-1 text-xs text-danger">{children}</p> : null;

const Label = ({ children }) => (
  <span className="mb-1.5 block text-xs font-medium text-muted">
    {children}
  </span>
);

const VariantsEditor = ({
  variants,
  onChange,
  errors,
  suggestions,
  liveStock,
  onEditStock,
}) => {
  const nameOptions = [...suggestions.keys()];

  const patchVariant = (i, patch) =>
    onChange(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const patchAttribute = (i, j, patch) =>
    patchVariant(i, {
      attributes: variants[i].attributes.map((a, idx) =>
        idx === j ? { ...a, ...patch } : a,
      ),
    });

  const addAttribute = (i) =>
    patchVariant(i, {
      attributes: [...variants[i].attributes, emptyAttribute()],
    });

  const removeAttribute = (i, j) =>
    patchVariant(i, {
      attributes: variants[i].attributes.filter((_, idx) => idx !== j),
    });

  // واریانت جدید با همون نام ویژگی‌های واریانت اول ساخته می‌شه (مقدارها خالی)
  const addVariant = () => {
    const template =
      variants[0]?.attributes
        .filter((a) => a.name.trim())
        .map((a) => ({ name: a.name, value: "" })) ?? [];
    onChange([
      ...variants,
      {
        ...emptyVariant(),
        attributes: template.length ? template : [emptyAttribute()],
      },
    ]);
  };

  const duplicateVariant = (i) => {
    const source = variants[i];
    const copy = {
      key: uid(),
      _id: null,
      attributes: source.attributes.map((a) => ({ ...a })),
      price: source.price,
      stock: "0",
      sku: "",
    };
    onChange([...variants.slice(0, i + 1), copy, ...variants.slice(i + 1)]);
  };

  const removeVariant = (i) => onChange(variants.filter((_, idx) => idx !== i));

  return (
    <div data-field="variants">
      <datalist id="attribute-names">
        {nameOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {errors.variants && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/40 bg-danger/5 px-3.5 py-2.5 text-xs leading-6 text-danger"
        >
          {errors.variants}
        </p>
      )}

      <ul className="space-y-4">
        {variants.map((variant, i) => {
          const price = toNumber(variant.price);
          const stockNow = variant._id
            ? (liveStock[variant._id] ?? toNumber(variant.stock))
            : null;

          return (
            <li
              key={variant.key}
              className="rounded-xl border border-line bg-ink/40 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-paper">
                  واریانت {toPersianDigits(i + 1)}
                  {!variant._id && (
                    <span className="mr-2 text-[11px] font-normal text-bronze">
                      جدید
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="کپی واریانت"
                    aria-label="کپی واریانت"
                    onClick={() => duplicateVariant(i)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="حذف واریانت"
                    aria-label="حذف واریانت"
                    className="hover:text-danger"
                    disabled={variants.length === 1}
                    onClick={() => removeVariant(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div data-field={`variants.${i}.attributes`}>
                <Label>ویژگی‌ها (مثلاً وزن: 3 کیلوگرم)</Label>
                <ul className="space-y-2">
                  {variant.attributes.map((attr, j) => {
                    const values = suggestions.get(attr.name.trim()) ?? [];
                    const listId = `values-${variant.key}-${j}`;
                    const nameError =
                      errors[`variants.${i}.attributes.${j}.name`];
                    const valueError =
                      errors[`variants.${i}.attributes.${j}.value`];

                    return (
                      <li key={j}>
                        <div className="grid grid-cols-[1fr_1.4fr_auto] items-start gap-2">
                          <Input
                            data-field={`variants.${i}.attributes.${j}.name`}
                            list="attribute-names"
                            value={attr.name}
                            error={nameError}
                            maxLength={40}
                            placeholder="نام ویژگی"
                            aria-label="نام ویژگی"
                            onChange={(e) =>
                              patchAttribute(i, j, { name: e.target.value })
                            }
                          />
                          <Input
                            data-field={`variants.${i}.attributes.${j}.value`}
                            list={listId}
                            value={attr.value}
                            error={valueError}
                            maxLength={80}
                            placeholder="مقدار"
                            aria-label="مقدار ویژگی"
                            onChange={(e) =>
                              patchAttribute(i, j, { value: e.target.value })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="حذف ویژگی"
                            title="حذف ویژگی"
                            disabled={variant.attributes.length === 1}
                            onClick={() => removeAttribute(i, j)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <datalist id={listId}>
                          {values.map((value) => (
                            <option key={value} value={value} />
                          ))}
                        </datalist>
                        <ErrorText>{nameError || valueError}</ErrorText>
                      </li>
                    );
                  })}
                </ul>
                <ErrorText>{errors[`variants.${i}.attributes`]}</ErrorText>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                  className="mt-2"
                  onClick={() => addAttribute(i)}
                >
                  ویژگی دیگر
                </Button>
              </div>

              <ErrorText>{errors[`variants.${i}.duplicate`]}</ErrorText>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <Label>قیمت (تومان)</Label>
                  <Input
                    data-field={`variants.${i}.price`}
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={variant.price}
                    error={errors[`variants.${i}.price`]}
                    placeholder="مثلاً 450000"
                    onChange={(e) => patchVariant(i, { price: e.target.value })}
                  />
                  {Number.isFinite(price) && price > 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      {formatToman(price)}
                    </p>
                  ) : (
                    <ErrorText>{errors[`variants.${i}.price`]}</ErrorText>
                  )}
                </div>

                <div>
                  <Label>موجودی</Label>
                  {variant._id ? (
                    <>
                      <div className="flex items-center justify-between rounded-lg border border-line bg-well px-3 py-2 text-sm text-paper">
                        <span>{toPersianDigits(stockNow)} عدد</span>
                        <button
                          type="button"
                          onClick={onEditStock}
                          className="text-xs text-bronze transition-opacity hover:opacity-80"
                        >
                          تغییر
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        با ویرایش سریع موجودی تغییر می‌کند.
                      </p>
                    </>
                  ) : (
                    <>
                      <Input
                        data-field={`variants.${i}.stock`}
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={variant.stock}
                        error={errors[`variants.${i}.stock`]}
                        onChange={(e) =>
                          patchVariant(i, { stock: e.target.value })
                        }
                      />
                      <ErrorText>{errors[`variants.${i}.stock`]}</ErrorText>
                    </>
                  )}
                </div>

                <div>
                  <Label>SKU (اختیاری)</Label>
                  <Input
                    data-field={`variants.${i}.sku`}
                    dir="ltr"
                    value={variant.sku}
                    error={errors[`variants.${i}.sku`]}
                    maxLength={60}
                    placeholder="خودکار"
                    onChange={(e) => patchVariant(i, { sku: e.target.value })}
                  />
                  <ErrorText>{errors[`variants.${i}.sku`]}</ErrorText>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Button
        variant="secondary"
        icon={Plus}
        className="mt-4"
        onClick={addVariant}
      >
        افزودن واریانت
      </Button>
    </div>
  );
};

export default VariantsEditor;
