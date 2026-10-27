import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

const useReport = (path, params, enabled = true) =>
  useQuery({
    queryKey: ["admin", "dashboard", path, params],
    queryFn: ({ signal }) =>
      axiosInstance.get(`/dashboard/${path}`, { params, signal }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  });

export const useOverview = (range) => useReport("overview", range);
export const useSales = (range, granularity) =>
  useReport("sales", granularity === "auto" ? range : { ...range, granularity });
export const useStatusBreakdown = (range) => useReport("status", range);
export const useTopProducts = (range, metric) => useReport("top-products", { ...range, metric });
export const useCategories = (range, enabled) => useReport("categories", range, enabled);
export const useBrands = (range, enabled) => useReport("brands", range, enabled);
export const useCustomers = (range) => useReport("customers", range);
export const useDiscounts = (range) => useReport("discounts", range);
export const useFunnel = (range) => useReport("funnel", range);
export const usePatterns = (range) => useReport("patterns", range);
export const useGeo = (range) => useReport("geo", range);
export const useInventory = () => useReport("inventory", undefined);
export const useRecentOrders = () => useReport("recent-orders", undefined);