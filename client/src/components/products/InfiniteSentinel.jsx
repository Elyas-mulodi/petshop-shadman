import { useEffect, useRef } from "react";

// یه المان نامرئی که وقتی وارد viewport بشه، صفحه بعد رو لود می‌کنه
const InfiniteSentinel = ({ onVisible, disabled }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && onVisible(),
      { rootMargin: "400px" }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [disabled, onVisible]);

  return <div ref={ref} className="h-1" aria-hidden="true" />;
};

export default InfiniteSentinel;