import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

// دسته و برند توی فرم و فیلتر محصولات هم استفاده می‌شن، پس هر دو گروه کش تازه می‌شن
const useCatalogMutation = (request, scopes) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      scopes.forEach((scope) =>
        queryClient.invalidateQueries({ queryKey: ["admin", scope] }),
      ),
  });
};

// body می‌تونه FormData (با عکس) یا آبجکت ساده (مثلاً فقط isActive) باشه
export const useSaveCategory = () =>
  useCatalogMutation(
    ({ id, body }) =>
      (id
        ? axiosInstance.put(`/categories/${id}`, body)
        : axiosInstance.post("/categories", body)
      ).then((res) => res.data.data),
    ["categories", "products"],
  );

export const useDeleteCategory = () =>
  useCatalogMutation(
    (id) => axiosInstance.delete(`/categories/${id}`).then((res) => res.data),
    ["categories", "products"],
  );

export const useSaveBrand = () =>
  useCatalogMutation(
    ({ id, body }) =>
      (id
        ? axiosInstance.put(`/brands/${id}`, body)
        : axiosInstance.post("/brands", body)
      ).then((res) => res.data.data),
    ["brands", "products"],
  );

export const useDeleteBrand = () =>
  useCatalogMutation(
    (id) => axiosInstance.delete(`/brands/${id}`).then((res) => res.data),
    ["brands", "products"],
  );
