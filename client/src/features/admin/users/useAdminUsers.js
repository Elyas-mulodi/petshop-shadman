import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

const get = (url, config) =>
  axiosInstance.get(url, config).then((res) => res.data);

export const useAdminUsers = (params) =>
  useQuery({
    queryKey: ["admin", "users", "list", params],
    queryFn: ({ signal }) => get("/users/admin/all", { params, signal }),
    placeholderData: keepPreviousData,
  });

export const useUserCounts = () =>
  useQuery({
    queryKey: ["admin", "users", "counts"],
    queryFn: ({ signal }) =>
      get("/users/admin/counts", { signal }).then((r) => r.data),
  });

export const useTopCustomers = () =>
  useQuery({
    queryKey: ["admin", "users", "top"],
    queryFn: ({ signal }) =>
      get("/users/admin/top", { signal }).then((r) => r.data),
    staleTime: 2 * 60_000,
  });

export const useAdminUser = (id) =>
  useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: ({ signal }) =>
      get(`/users/admin/${id}`, { signal }).then((r) => r.data),
  });

const useUserMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });
};

export const useToggleBlockUser = () =>
  useUserMutation(({ id, reason }) =>
    axiosInstance
      .patch(`/users/admin/${id}/toggle-block`, reason ? { reason } : {})
      .then((res) => res.data),
  );

export const useAddUserNote = (id) =>
  useUserMutation((payload) =>
    axiosInstance
      .post(`/users/admin/${id}/notes`, payload)
      .then((res) => res.data),
  );
