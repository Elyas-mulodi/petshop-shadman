import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useAdminSettings = () =>
  useQuery({
    queryKey: ["admin", "settings"],
    queryFn: ({ signal }) =>
      axiosInstance.get("/settings", { signal }).then((res) => res.data.data),
  });

export const useSaveSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) =>
      axiosInstance.put("/settings", body).then((res) => res.data.data),
    onSuccess: () => {
      // آستانه‌ی کم‌موجودی روی داشبورد و محصولات اثر داره
      ["settings", "audit", "dashboard", "products"].forEach((scope) =>
        queryClient.invalidateQueries({ queryKey: ["admin", scope] }),
      );
    },
  });
};
