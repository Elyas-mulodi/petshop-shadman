import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useAdminOrder = (id) =>
  useQuery({
    queryKey: ["admin", "orders", "detail", id],
    queryFn: ({ signal }) =>
      axiosInstance.get(`/orders/admin/${id}`, { signal }).then((res) => res.data.data),
  });

// بعد از هر تغییر، سفارش و گزارش‌های وابسته (لیست، داشبورد) دوباره خونده می‌شن
const useOrderMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
};

export const useUpdateOrderStatus = (id) =>
  useOrderMutation((payload) => axiosInstance.patch(`/orders/admin/${id}/status`, payload).then((res) => res.data));

export const useUpdateShipping = (id) =>
  useOrderMutation((payload) => axiosInstance.patch(`/orders/admin/${id}/shipping`, payload).then((res) => res.data));

export const useAddOrderNote = (id) =>
  useOrderMutation((payload) => axiosInstance.post(`/orders/admin/${id}/notes`, payload).then((res) => res.data));

export const useMarkRefunded = (id) =>
  useOrderMutation((payload) => axiosInstance.patch(`/orders/admin/${id}/refund`, payload).then((res) => res.data));