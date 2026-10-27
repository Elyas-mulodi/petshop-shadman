import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, isDay, todayTehran } from "../../../utils/tehranDate";

export const PRESETS = [
  { id: "7", label: "۷ روز", days: 7 },
  { id: "30", label: "۳۰ روز", days: 30 },
  { id: "90", label: "۹۰ روز", days: 90 },
  { id: "365", label: "یک سال", days: 365 },
];

export const useDashboardRange = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPreset = searchParams.get("range");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const preset =
    rawPreset === "custom"
      ? "custom"
      : PRESETS.some((p) => p.id === rawPreset)
        ? rawPreset
        : "30";

  const range = useMemo(() => {
    if (preset === "custom" && isDay(from) && isDay(to) && from <= to)
      return { from, to };

    const days = PRESETS.find((p) => p.id === preset)?.days ?? 30;
    const end = todayTehran();
    return { from: addDays(end, -(days - 1)), to: end };
  }, [preset, from, to]);

  const setPreset = useCallback(
    (id) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("from");
          next.delete("to");
          if (id === "30") next.delete("range");
          else next.set("range", id);
          if (id === "custom") {
            next.set("from", range.from);
            next.set("to", range.to);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, range],
  );

  const setCustom = useCallback(
    ({ from: nextFrom, to: nextTo }) => {
      if (!isDay(nextFrom) || !isDay(nextTo) || nextFrom > nextTo) return;
      setSearchParams(
        { range: "custom", from: nextFrom, to: nextTo },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { preset, range, setPreset, setCustom };
};
