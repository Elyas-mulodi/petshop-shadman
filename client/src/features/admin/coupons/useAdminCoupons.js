import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useAdminCoupons = (params) =>
  useQuery({
    queryKey: ["admin", "coupons", "list", params],
    queryFn: ({ signal }) => axiosInstance.get("/coupons", { params, signal }).then((res) => res.data),
    placeholderData: keepPreviousData,
  });

export const useCouponCounts = () =>
  useQuery({
    queryKey: ["admin", "coupons", "counts"],
    queryFn: ({ signal }) => axiosInstance.get("/coupons/counts", { signal }).then((res) => res.data.data),
  });

const useCouponMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
};

export const useSaveCoupon = () =>
  useCouponMutation(({ id, body }) =>
    (id ? axiosInstance.put(`/coupons/${id}`, body) : axiosInstance.post("/coupons", body)).then(
      (res) => res.data.data,
    ),
  );

export const useDeleteCoupon = () =>
  useCouponMutation((id) => axiosInstance.delete(`/coupons/${id}`).then((res) => res.data));