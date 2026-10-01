// توی موبایل/تبلت: اسکرول افقی با اسنپ. توی دسکتاپ (lg+): گرید معمولی چهارستونه.
export const CarouselGrid = ({ children, className = "" }) => (
  <div
    className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden ${className}`}
  >
    {children}
  </div>
);

// هر آیتم عرض ثابت موبایلی می‌گیره (با کمی از کارت بعدی پیدا باشه) و توی دسکتاپ عرض خودکار گرید
export const CarouselItem = ({ children, wide = false, className = "" }) => (
  <div
    className={`shrink-0 snap-start ${wide ? "w-[72vw] sm:w-[320px]" : "w-[42vw] sm:w-[200px]"} lg:w-auto ${className}`}
  >
    {children}
  </div>
);