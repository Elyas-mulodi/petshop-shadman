import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";
import { todayTehran } from "../../../utils/tehranDate";

export const useInventoryList = (params) =>
  useQuery({
    queryKey: ["admin", "inventory", "list", params],
    queryFn: ({ signal }) =>
      axiosInstance
        .get("/products/admin/inventory", { params, signal })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

export const useInventorySummary = () =>
  useQuery({
    queryKey: ["admin", "inventory", "summary"],
    queryFn: ({ signal }) =>
      axiosInstance
        .get("/products/admin/inventory/summary", { signal })
        .then((res) => res.data.data),
  });

// تغییر موجودی: لیست انبار، لیست محصولات و گزارش‌های داشبورد تازه می‌شن
export const useSetStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, variantId, stock, expected }) =>
      axiosInstance
        .patch(`/products/admin/${productId}/variants/${variantId}/stock`, {
          stock,
          expected,
        })
        .then((res) => res.data.data),
    onSuccess: () => {
      ["inventory", "products", "dashboard", "audit"].forEach((scope) =>
        queryClient.invalidateQueries({ queryKey: ["admin", scope] }),
      );
    },
  });
};

export const downloadInventoryCsv = async (params) => {
  const res = await axiosInstance.get("/products/admin/inventory/export", {
    params,
    responseType: "blob",
  });

  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `inventory-${todayTehran()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
