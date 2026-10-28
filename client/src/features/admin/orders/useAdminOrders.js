
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import axiosInstance from "../../../utils/axiosInstance";
import { todayTehran } from "../../../utils/tehranDate";

// ---------- لیست سفارش‌های پنل مدیریت ----------
export const useAdminOrders = (params) =>
  useQuery({
    queryKey: ["admin", "orders", "list", params],
    queryFn: ({ signal }) =>
      axiosInstance
        .get("/orders/admin/all", { params, signal })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
  });

// ---------- تعداد سفارش‌ها بر اساس وضعیت ----------
export const useOrderCounts = (params) =>
  useQuery({
    queryKey: ["admin", "orders", "counts", params],
    queryFn: ({ signal }) =>
      axiosInstance
        .get("/orders/admin/counts", { params, signal })
        .then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

// ---------- پردازش گروهی سفارش‌ها ----------
export const useBulkProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) =>
      axiosInstance
        .patch("/orders/admin/bulk-status", {
          ids,
          status: "processing",
        })
        .then((res) => res.data.data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard"],
      });
    },
  });
};

// ---------- دانلود CSV سفارش‌ها ----------
export const downloadOrdersCsv = async (params) => {
  const res = await axiosInstance.get("/orders/admin/export", {
    params,
    responseType: "blob",
  });

  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");

  link.href = url;
  link.download = `orders-${todayTehran()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // کمی تأخیر برای جلوگیری از آزاد شدن زودهنگام Blob
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ---------- خواندن خطای پاسخ Blob ----------
export const readBlobError = async (err) => {
  try {
    const data = err?.response?.data;

    if (data instanceof Blob) {
      const text = await data.text();
      const parsed = JSON.parse(text);

      if (parsed?.message) {
        return parsed.message;
      }
    }
  } catch {
    // پاسخ سرور JSON معتبر نیست
  }

  return "دریافت فایل خروجی با خطا مواجه شد";
};

// ---------- جزئیات سفارش ----------
export const useAdminOrder = (id) =>
  useQuery({
    queryKey: ["admin", "orders", "detail", id],
    queryFn: ({ signal }) =>
      axiosInstance
        .get(`/orders/admin/${id}`, { signal })
        .then((res) => res.data.data),
    enabled: Boolean(id),
  });

// ---------- هوک مشترک تغییر سفارش ----------
const useOrderMutation = (request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "orders"],
      });

      queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard"],
      });
    },
  });
};

// ---------- تغییر وضعیت سفارش ----------
export const useUpdateOrderStatus = (id) =>
  useOrderMutation((payload) =>
    axiosInstance
      .patch(`/orders/admin/${id}/status`, payload)
      .then((res) => res.data)
  );

// ---------- اطلاعات ارسال ----------
export const useUpdateShipping = (id) =>
  useOrderMutation((payload) =>
    axiosInstance
      .patch(`/orders/admin/${id}/shipping`, payload)
      .then((res) => res.data)
  );

// ---------- یادداشت سفارش ----------
export const useAddOrderNote = (id) =>
  useOrderMutation((payload) =>
    axiosInstance
      .post(`/orders/admin/${id}/notes`, payload)
      .then((res) => res.data)
  );

// ---------- ثبت عودت وجه ----------
export const useMarkRefunded = (id) =>
  useOrderMutation((payload) =>
    axiosInstance
      .patch(`/orders/admin/${id}/refund`, payload)
      .then((res) => res.data)
  );
