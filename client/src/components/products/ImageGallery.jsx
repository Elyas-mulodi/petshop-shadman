import { useRef, useState } from "react";
import { PawPrint } from "lucide-react";
import { getImageUrl } from "../../utils/imageUrl";
import DiscountRibbon from "./DiscountRibbon";

const ImageGallery = ({ images = [], alt, discountPercent }) => {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const frameRef = useRef(null);

  const urls = images.map(getImageUrl);

  const handleMouseMove = (e) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div>
      {/* تصویر اصلی — زوم فقط با ماوس (دسکتاپ) فعال می‌شه */}
      <div
        ref={frameRef}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-line bg-well"
      >
        {discountPercent > 0 && <DiscountRibbon percent={discountPercent} />}

        {urls[active] ? (
          <img
            src={urls[active]}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-200 ease-out"
            style={{
              transform: zoomed ? "scale(1.9)" : "scale(1)",
              transformOrigin: origin,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PawPrint className="h-12 w-12 text-sage" strokeWidth={1.3} />
          </div>
        )}
      </div>

      {/* تصاویر کوچک */}
      {urls.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                active === i ? "border-bronze" : "border-line"
              }`}
            >
              <img src={url} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;