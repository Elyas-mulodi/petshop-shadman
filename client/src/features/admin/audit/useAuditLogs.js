import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";

export const useAuditLogs = (params) =>
  useQuery({
    queryKey: ["admin", "audit", "list", params],
    queryFn: ({ signal }) =>
      axiosInstance
        .get("/audit-logs", { params, signal })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });
