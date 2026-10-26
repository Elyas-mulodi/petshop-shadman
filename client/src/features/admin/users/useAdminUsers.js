import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useAdminUsers = (params) =>
  useQuery({
    queryKey: ["admin", "users", params],
    queryFn: ({ signal }) =>
      axiosInstance.get("/users/admin/all", { params, signal }).then((res) => res.data),
    placeholderData: keepPreviousData, // موقع عوض‌شدن صفحه یا جستجو، جدول پرنمی‌پره
  });

export const useToggleBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) =>
      axiosInstance.patch(`/users/admin/${id}/toggle-block`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};