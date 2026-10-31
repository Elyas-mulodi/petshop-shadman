import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

const get = (url, config) =>
  axiosInstance.get(url, config).then((res) => res.data);

export const useAdminProducts = (params) =>
  useQuery({
    queryKey: ["admin", "products", "list", params],
    queryFn: ({ signal }) => get("/products/admin/all", { params, signal }),
    placeholderData: keepPreviousData,
  });

export const useProductCounts = () =>
  useQuery({
    queryKey: ["admin", "products", "counts"],
    queryFn: ({ signal }) =>
      get("/products/admin/counts", { signal }).then((r) => r.data),
  });

export const useAdminProduct = (id, enabled = true) =>
  useQuery({
    queryKey: ["admin", "products", "detail", id],
    queryFn: ({ signal }) =>
      get(`/products/admin/${id}`, { signal }).then((r) => r.data),
    enabled: !!id && enabled,
  });

export const useAttributeSuggestions = () =>
  useQuery({
    queryKey: ["admin", "products", "attributes"],
    queryFn: ({ signal }) =>
      get("/products/admin/attributes", { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });

export const useAdminCategories = () =>
  useQuery({
    queryKey: ["admin", "categories", "all"],
    queryFn: ({ signal }) =>
      get("/categories/admin/all", { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });

export const useAdminBrands = () =>
  useQuery({
    queryKey: ["admin", "brands", "all"],
    queryFn: ({ signal }) =>
      get("/brands/admin/all", { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  
// بعد از هر تغییر، لیست و شمارنده‌ها و گزارش موجودی داشبورد تازه می‌شن
const useProductMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
};

export const useBulkSetActive = () =>
  useProductMutation(({ ids, isActive }) =>
    axiosInstance
      .patch("/products/admin/bulk-active", { ids, isActive })
      .then((res) => res.data.data),
  );

export const useDeleteProduct = () =>
  useProductMutation((id) =>
    axiosInstance.delete(`/products/${id}`).then((res) => res.data),
  );

export const useDuplicateProduct = () =>
  useProductMutation((id) =>
    axiosInstance
      .post(`/products/admin/${id}/duplicate`)
      .then((res) => res.data.data),
  );

export const useUpdateStock = (productId) =>
  useProductMutation(({ variantId, stock, expected }) =>
    axiosInstance
      .patch(`/products/admin/${productId}/variants/${variantId}/stock`, {
        stock,
        expected,
      })
      .then((res) => res.data.data),
  );

export const useCreateProduct = () =>
  useProductMutation((payload) =>
    axiosInstance.post("/products", payload).then((res) => res.data.data),
  );

export const useUpdateProduct = (id) =>
  useProductMutation((payload) =>
    axiosInstance.put(`/products/${id}`, payload).then((res) => res.data.data),
  );
