import { useEffect, useReducer, useState } from "react";

import axiosInstance from "../../utils/axiosInstance";

const STALE_MS = 5 * 60 * 1000;

let cache = { data: null, at: 0 };
let inflight = null;
let version = 0; // با هر invalidate زیاد میشه تا جواب درخواست قدیمی کش رو خراب نکنه
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn());
const isFresh = () => cache.data !== null && Date.now() - cache.at < STALE_MS;

const fetchBanners = () => {
  if (inflight) return inflight;

  const startedAt = version;
  const request = axiosInstance
    .get("/banners")
    .then((res) => {
      const data = res.data.data;
      if (startedAt === version) {
        cache = { data, at: Date.now() };
        notify();
      }
      return data;
    })
    .finally(() => {
      if (inflight === request) inflight = null;
    });

  inflight = request;
  return request;
};

// بعد از هر ساخت، ویرایش یا حذف بنر توی پنل ادمین صدا زده میشه.
// قبلاً کش ۵ دقیقه‌ای هیچ‌وقت باطل نمی‌شد، برای همین تغییرات پنل توی سایت دیده نمی‌شد.
export const invalidateBanners = () => {
  version += 1;
  inflight = null;
  cache = { ...cache, at: 0 }; // داده‌ی قبلی تا رسیدن داده‌ی تازه نمایش داده میشه
  if (listeners.size > 0) fetchBanners().catch(() => {});
};

// بنرهای فعال و داخل بازه‌ی زمان‌بندی (سرور مرتب‌شده بر اساس order میده)
export const useBanners = () => {
  const [, rerender] = useReducer((n) => n + 1, 0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    listeners.add(rerender);

    if (!isFresh()) {
      // اگه سرور جواب نداد، BentoHero با محتوای پیش‌فرض نمایش داده میشه
      fetchBanners().catch(() => active && setFailed(true));
    }

    return () => {
      active = false;
      listeners.delete(rerender);
    };
  }, []);

  return { data: cache.data, isPending: cache.data === null && !failed };
};