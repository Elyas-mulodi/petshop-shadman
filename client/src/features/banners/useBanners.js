import { useEffect, useState } from "react";

import axiosInstance from "../../utils/axiosInstance";

const STALE_MS = 5 * 60 * 1000;

let cache = { data: null, at: 0 };
let inflight = null;

const isFresh = () => cache.data !== null && Date.now() - cache.at < STALE_MS;

const fetchBanners = () => {
  if (!inflight) {
    inflight = axiosInstance
      .get("/banners")
      .then((res) => {
        cache = { data: res.data.data, at: Date.now() };
        return cache.data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

// بنرهای فعال و داخل بازه‌ی زمان‌بندی (سرور مرتب‌شده بر اساس order میده)
export const useBanners = () => {
  const [state, setState] = useState(() => ({ data: cache.data, isPending: cache.data === null }));

  useEffect(() => {
    if (isFresh()) return undefined;

    let active = true;

    fetchBanners()
      .then((data) => active && setState({ data, isPending: false }))
      // اگه سرور جواب نداد، BentoHero با محتوای پیش‌فرض نمایش داده میشه
      .catch(() => active && setState((prev) => ({ data: prev.data, isPending: false })));

    return () => {
      active = false;
    };
  }, []);

  return state;
};