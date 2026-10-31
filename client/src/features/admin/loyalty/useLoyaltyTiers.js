import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useLoyaltyTiers = () =>
  useQuery({
    queryKey: ["admin", "loyalty", "tiers"],
    queryFn: ({ signal }) =>
      axiosInstance
        .get("/loyalty-tiers", { signal })
        .then((res) => res.data.data),
  });

const useTierMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "loyalty"] }),
  });
};

export const useSaveTier = () =>
  useTierMutation(({ id, body }) =>
    (id
      ? axiosInstance.put(`/loyalty-tiers/${id}`, body)
      : axiosInstance.post("/loyalty-tiers", body)
    ).then((res) => res.data.data),
  );

export const useDeleteTier = () =>
  useTierMutation((id) =>
    axiosInstance.delete(`/loyalty-tiers/${id}`).then((res) => res.data),
  );
