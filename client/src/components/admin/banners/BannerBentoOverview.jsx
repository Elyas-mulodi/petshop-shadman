import { Plus } from "lucide-react";
import BannerTilePreview from "./BannerTilePreview";
import { SLOT_LABELS, getBannerStatus } from "./bannerUtils";

const CELLS = [
  { slot: "main", className: "col-span-2 row-span-2" },
  { slot: "tall", className: "col-span-1 row-span-2" },
  { slot: "square", className: "col-span-1 row-span-1" },
  { slot: "info", className: "col-span-1 row-span-1" },
];

// نمای کوچیک هیرو: هر تایل بنر فعالِ اولش رو نشون میده
const BannerBentoOverview = ({ banners, onOpen, onAdd }) => (
  <div className="hidden grid-cols-4 grid-rows-2 gap-3 md:grid" style={{ height: 320 }}>
    {CELLS.map(({ slot, className }) => {
      const inSlot = banners.filter((b) => b.slot === slot);
      const live = inSlot.filter((b) => getBannerStatus(b).live);
      const shown = live[0];

      if (!shown) {
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onAdd(slot)}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-muted transition-colors hover:border-bronze/60 hover:text-paper ${className}`}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">افزودن {SLOT_LABELS[slot]}</span>
            {inSlot.length > 0 && <span className="text-[10px] text-muted/70">بنر فعالی ندارد</span>}
          </button>
        );
      }

      return (
        <button
          key={slot}
          type="button"
          onClick={() => onOpen(shown)}
          aria-label={`ویرایش ${shown.title}`}
          className={`group relative text-start ${className}`}
        >
          <BannerTilePreview banner={shown} className="h-full w-full" />
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/60 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100">
            ویرایش
          </span>
          {live.length > 1 && (
            <span className="absolute left-2 top-2 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] text-muted">
              +{live.length - 1}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default BannerBentoOverview;