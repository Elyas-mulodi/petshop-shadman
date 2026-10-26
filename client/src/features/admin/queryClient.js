import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // خطای ۴xx (دسترسی، پیدا نشد، ولیدیشن) با تکرار درست نمی‌شه
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: { retry: false },
  },
});