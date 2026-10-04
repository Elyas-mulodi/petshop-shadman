import { toPersianDigits } from "../../utils/authHelpers";
import { getAttributeGroups, isValueAvailable } from "../../utils/variantHelpers";

const VariantSelector = ({ variants, selections, onSelect }) => {
  const groups = getAttributeGroups(variants);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="mb-2.5 text-xs font-medium text-muted">{group.name}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const available = isValueAvailable(
                variants,
                { ...selections, [group.name]: undefined },
                group.name,
                value
              );
              const selected = selections[group.name] === value;

              return (
                <button
                  key={value}
                  disabled={!available}
                  onClick={() => onSelect(group.name, value)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    selected
                      ? "border-bronze bg-bronze text-ink"
                      : available
                      ? "border-line text-paper hover:border-bronze/60"
                      : "border-line text-muted/40 line-through"
                  }`}
                >
                  {toPersianDigits(value)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VariantSelector;