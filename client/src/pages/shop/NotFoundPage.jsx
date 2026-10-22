import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PawPrint, Search } from "lucide-react";

const NotFoundPage = () => {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim())
      navigate(`/products?search=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center lg:py-28">
      <div
        role="img"
        aria-label="خطای ۴۰۴"
        className="flex items-center justify-center gap-3 font-display text-8xl font-bold leading-none text-bronze md:text-9xl"
      >
        <span>۴</span>
        <PawPrint
          className="h-20 w-20 -rotate-12 text-sage md:h-28 md:w-28"
          strokeWidth={1.2}
        />
        <span>۴</span>
      </div>

      <h1 className="mt-8 font-display text-xl font-bold text-paper md:text-2xl">
        این صفحه پیدا نشد
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-muted">
        آدرسی که باز کرده‌اید وجود ندارد یا جابه‌جا شده است. می‌توانید محصول
        مورد نظرتان را جستجو کنید.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm">
        <div className="relative">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="جستجوی محصول..."
            className="w-full rounded-lg border border-line bg-card py-2.5 pr-10 pl-4 text-sm text-paper transition-colors placeholder:text-muted focus:border-sage focus:outline-none"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
        </div>
      </form>

      <div className="mt-6 flex gap-3">
        <Link
          to="/"
          className="rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          صفحه‌ی اصلی
        </Link>
        <Link
          to="/products"
          className="rounded-lg border border-line px-6 py-2.5 text-sm text-paper transition-colors hover:border-bronze/60 hover:text-bronze"
        >
          مشاهده محصولات
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
