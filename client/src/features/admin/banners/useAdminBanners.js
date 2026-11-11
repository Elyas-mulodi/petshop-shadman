import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useAdminBanners = () =>
  useQuery({
    queryKey: ["admin", "banners", "list"],
    queryFn: ({ signal }) => axiosInstance.get("/banners/admin/list", { signal }).then((res) => res.data.data),
  });

export const useAdminBanner = (id) =>
  useQuery({
    queryKey: ["admin", "banners", "detail", id],
    queryFn: ({ signal }) => axiosInstance.get(`/banners/admin/${id}`, { signal }).then((res) => res.data.data),
    enabled: Boolean(id),
  });

const useBannerMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      ["banners", "audit"].forEach((scope) => queryClient.invalidateQueries({ queryKey: ["admin", scope] }));
    },
  });
};

export const useCreateBanner = () =>
  useBannerMutation((payload) => axiosInstance.post("/banners", payload).then((res) => res.data));

// mutate({ id, body })
export const useUpdateBanner = () =>
  useBannerMutation(({ id, body }) => axiosInstance.patch(`/banners/${id}`, body).then((res) => res.data));

export const useDeleteBanner = () =>
  useBannerMutation((id) => axiosInstance.delete(`/banners/${id}`).then((res) => res.data));

// فقط فایل رو آپلود می‌کنه و آدرس برمی‌گردونه (مثل /uploads/banners/123-45.webp)
export const uploadBannerImage = async (file) => {
  const body = new FormData();
  body.append("image", file);

  const res = await axiosInstance.post("/banners/admin/upload", body);
  return res.data.data.url;
};