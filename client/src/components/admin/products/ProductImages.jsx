import { useState } from "react";
import ImageGrid from "./ImageGrid";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useToast } from "../ui/ToastProvider";
import {
  MAX_IMAGES,
  checkImageFiles,
  moveItem,
  summarizeRejected,
  useRemoveImage,
  useReorderImages,
  useUploadImages,
} from "../../../features/admin/products/productImages";
import { getImageUrl } from "../../../utils/imageUrl";
import { parseApiError, toPersianDigits } from "../../../utils/authHelpers";

// ---------- ویرایش: هر عملیات همان لحظه روی سرور اعمال می‌شود ----------
export const ImageManager = ({ productId, images }) => {
  const toast = useToast();
  const upload = useUploadImages(productId);
  const remove = useRemoveImage(productId);
  const reorder = useReorderImages(productId);
  const [progress, setProgress] = useState(null);
  const [removeIndex, setRemoveIndex] = useState(null);

  const items = images.map((url) => ({ key: url, src: getImageUrl(url) }));

  const handleAdd = (files) => {
    const { accepted, rejected } = checkImageFiles(
      files,
      MAX_IMAGES - images.length,
    );
    if (rejected.length > 0) toast.error(summarizeRejected(rejected));
    if (accepted.length === 0) return;

    upload.mutate(
      { files: accepted, onProgress: setProgress },
      {
        onSuccess: () =>
          toast.success(`${toPersianDigits(accepted.length)} عکس اضافه شد`),
        onError: (err) => toast.error(parseApiError(err).message),
        onSettled: () => setProgress(null),
      },
    );
  };

  const applyOrder = (next) =>
    reorder.mutate(next, {
      onError: (err) => toast.error(parseApiError(err).message),
    });

  const handleConfirmRemove = () =>
    remove.mutate(images[removeIndex], {
      onSuccess: () => {
        toast.success("عکس حذف شد");
        setRemoveIndex(null);
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
        setRemoveIndex(null);
      },
    });

  return (
    <>
      <ImageGrid
        items={items}
        busy={remove.isPending || reorder.isPending}
        uploading={upload.isPending}
        progress={progress}
        onAdd={handleAdd}
        onMove={(from, to) => applyOrder(moveItem(images, from, to))}
        onMakePrimary={(index) => applyOrder(moveItem(images, index, 0))}
        onRemove={setRemoveIndex}
      />

      <ConfirmDialog
        open={removeIndex !== null}
        title="حذف عکس؟"
        message="عکس از محصول حذف می‌شود. اگر این عکس روی سفارش‌های قبلی ثبت شده باشد، فایلش برای نمایش آن سفارش‌ها نگه داشته می‌شود."
        confirmLabel="حذف شود"
        loading={remove.isPending}
        onConfirm={handleConfirmRemove}
        onClose={() => setRemoveIndex(null)}
      />
    </>
  );
};

// ---------- ساخت محصول: عکس‌ها محلی‌اند و بعد از ساخت آپلود می‌شوند ----------
let sequence = 0;

export const PendingImages = ({ pending, onChange, disabled = false }) => {
  const toast = useToast();

  const handleAdd = (files) => {
    const { accepted, rejected } = checkImageFiles(
      files,
      MAX_IMAGES - pending.length,
    );
    if (rejected.length > 0) toast.error(summarizeRejected(rejected));
    if (accepted.length === 0) return;

    onChange([
      ...pending,
      ...accepted.map((file) => ({
        id: `img-${++sequence}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleMove = (from, to) => onChange(moveItem(pending, from, to));

  const handleRemove = (index) => {
    URL.revokeObjectURL(pending[index].url);
    onChange(pending.filter((_, i) => i !== index));
  };

  return (
    <ImageGrid
      items={pending.map((p) => ({ key: p.id, src: p.url }))}
      busy={disabled}
      onAdd={handleAdd}
      onMove={handleMove}
      onMakePrimary={(index) => handleMove(index, 0)}
      onRemove={handleRemove}
    />
  );
};
