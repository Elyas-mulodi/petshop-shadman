import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import axiosInstance from "../../../utils/axiosInstance";

// ---------- لیست بنرها ----------
export const useAdminBanners = () =>
  useQuery({
    queryKey: ["admin", "banners", "list"],
    queryFn: ({ signal }) =>
      axiosInstance.get("/banners/admin/list", { signal }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

// ---------- جزئیات یک بنر ----------
export const useAdminBanner = (id) =>
  useQuery({
    queryKey: ["admin", "banners", "detail", id],
    queryFn: ({ signal }) =>
      axiosInstance.get(`/banners/admin/${id}`, { signal }).then((res) => res.data.data),
    enabled: Boolean(id),
  });

// ---------- هوک مشترک تغییر بنر ----------
const useBannerMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
  });
};

// ---------- ساخت بنر ----------
export const useCreateBanner = () =>
  useBannerMutation((payload) => axiosInstance.post("/banners", payload).then((res) => res.data));

// ---------- ویرایش بنر: mutate({ id, body }) ----------
export const useUpdateBanner = () =>
  useBannerMutation(({ id, body }) => axiosInstance.patch(`/banners/${id}`, body).then((res) => res.data));

// ---------- حذف بنر ----------
export const useDeleteBanner = () =>
  useBannerMutation((id) => axiosInstance.delete(`/banners/${id}`).then((res) => res.data));

// ---------- آپلود تصویر بنر ----------
// ⚠️ آدرس و اسم فیلد رو با آپلود عکس محصول یکی کن (من اون کد رو ندارم و حدس زدم)
export const uploadBannerImage = async (file) => {
  const data = new FormData();
  data.append("image", file);

  const res = await axiosInstance.post("/uploads", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const result = res.data.data;
  return typeof result === "string" ? result : (result.url ?? result.path);
};