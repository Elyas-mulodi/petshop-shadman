import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";
import { toPersianDigits } from "../../../utils/authHelpers";

export const MAX_IMAGES = 8; // هماهنگ با upload.array("images", 8) در بکند
export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // هماهنگ با multer
export const ACCEPT = "image/jpeg,image/png,image/webp";

const ALLOWED_TYPES = ACCEPT.split(",");

// فایل‌ها قبل از ارسال بررسی می‌شن؛ remaining = جای خالی تا سقف ۸ عکس
export const checkImageFiles = (files, remaining) => {
  const accepted = [];
  const rejected = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      rejected.push({
        name: file.name,
        reason: "فرمت مجاز نیست (فقط jpg، png و webp)",
      });
    } else if (file.size > MAX_IMAGE_SIZE) {
      rejected.push({ name: file.name, reason: "حجم بیشتر از ۳ مگابایت است" });
    } else if (accepted.length >= remaining) {
      rejected.push({
        name: file.name,
        reason: `حداکثر ${toPersianDigits(MAX_IMAGES)} عکس مجاز است`,
      });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
};

export const summarizeRejected = (rejected) => {
  const shown = rejected
    .slice(0, 3)
    .map((r) => `${r.name} (${r.reason})`)
    .join("، ");
  const more =
    rejected.length > 3
      ? ` و ${toPersianDigits(rejected.length - 3)} مورد دیگر`
      : "";
  return `${toPersianDigits(rejected.length)} فایل اضافه نشد: ${shown}${more}`;
};

export const moveItem = (list, from, to) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

// فایل‌ها به همین ترتیب ذخیره می‌شن (عکس اول، تصویر اصلی است)
export const uploadProductImages = (productId, files, onProgress) => {
  const body = new FormData();
  files.forEach((file) => body.append("images", file));

  return axiosInstance
    .post(`/products/admin/${productId}/images`, body, {
      onUploadProgress: (e) =>
        e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })
    .then((res) => res.data.data);
};

const detailKey = (id) => ["admin", "products", "detail", id];

// بعد از آپلود یا حذف، تصاویر همون لحظه توی کش محصول جایگزین می‌شن و لیست محصولات (تصویر اصلی) تازه می‌شه
const useImageMutation = (productId, request) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: request,
    onSuccess: (images) => {
      queryClient.setQueryData(detailKey(productId), (old) =>
        old ? { ...old, images } : old,
      );
      queryClient.invalidateQueries({
        queryKey: ["admin", "products", "list"],
      });
    },
  });
};

export const useUploadImages = (productId) =>
  useImageMutation(productId, ({ files, onProgress }) =>
    uploadProductImages(productId, files, onProgress),
  );

export const useRemoveImage = (productId) =>
  useImageMutation(productId, (imageUrl) =>
    axiosInstance
      .patch(`/products/${productId}/remove-image`, { imageUrl })
      .then((res) => res.data.data.images),
  );

// جابه‌جایی خوش‌بینانه است: اول نمایش داده می‌شه، اگه سرور رد کنه برمی‌گرده
export const useReorderImages = (productId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (images) =>
      axiosInstance
        .patch(`/products/admin/${productId}/images/order`, { images })
        .then((res) => res.data.data),
    onMutate: async (images) => {
      await queryClient.cancelQueries({ queryKey: detailKey(productId) });
      const previous = queryClient.getQueryData(detailKey(productId));
      queryClient.setQueryData(detailKey(productId), (old) =>
        old ? { ...old, images } : old,
      );
      return { previous };
    },
    onError: (_err, _images, context) => {
      if (context?.previous)
        queryClient.setQueryData(detailKey(productId), context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "products", "list"],
      }),
  });
};
