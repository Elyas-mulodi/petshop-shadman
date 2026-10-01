import { useEffect, useState } from "react";
import { getBrands } from "../../../features/brands/brandsApi";

const BrandSection = ({ value, onChange }) => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getBrands()
      .then((res) => setBrands(res.data.data))
      .catch(() => setBrands([]));
  }, []);

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((b) => b !== id) : [...value, id]);
  };

  if (brands.length === 0) return <p className="text-sm text-muted">برندی ثبت نشده است.</p>;

  return (
    <div className="flex flex-col gap-2.5">
      {brands.map((brand) => (
        <label key={brand._id} className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={value.includes(brand._id)}
            onChange={() => toggle(brand._id)}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-sm text-muted">{brand.name}</span>
        </label>
      ))}
    </div>
  );
};

export default BrandSection;