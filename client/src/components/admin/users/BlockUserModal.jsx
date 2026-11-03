import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useToast } from "../ui/ToastProvider";
import { FormError } from "../../auth/AuthParts";
import { TextAreaField } from "../../checkout/FormControls";
import { useToggleBlockUser } from "../../../features/admin/users/useAdminUsers";
import { parseApiError } from "../../../utils/authHelpers";

// user: کاربری که باید مسدود یا آزاد بشه (null = بسته)
const BlockUserModal = ({ user, onClose }) => {
  const toast = useToast();
  const toggle = useToggleBlockUser();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setReason("");
      setError("");
    }
  }, [user]);

  const submit = () => {
    setError("");
    toggle.mutate(
      { id: user._id, reason: user.isBlocked ? undefined : reason.trim() },
      {
        onSuccess: (res) => {
          toast.success(res.message);
          onClose();
        },
        onError: (err) => setError(parseApiError(err).message),
      },
    );
  };

  const blocking = !!user && !user.isBlocked;
  const unblocking = !!user && user.isBlocked;

  return (
    <>
      <Modal
        open={blocking}
        title="مسدود کردن کاربر"
        description={
          user
            ? `کاربر ${user.phone} دیگر نمی‌تواند وارد حساب خود شود و دسترسی‌هایش قطع می‌شود.`
            : ""
        }
        onClose={onClose}
        dismissible={!toggle.isPending}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={toggle.isPending}
            >
              انصراف
            </Button>
            <Button
              variant="danger"
              onClick={submit}
              loading={toggle.isPending}
            >
              مسدود شود
            </Button>
          </>
        }
      >
        <TextAreaField
          label="دلیل (اختیاری، فقط برای ادمین‌ها)"
          value={reason}
          maxLength={300}
          onChange={(e) => setReason(e.target.value)}
        />
        <FormError message={error} />
      </Modal>

      <ConfirmDialog
        open={unblocking}
        title="رفع مسدودی کاربر؟"
        message={
          user ? `کاربر ${user.phone} دوباره می‌تواند وارد حساب خود شود.` : ""
        }
        confirmLabel="رفع مسدودی"
        tone="primary"
        loading={toggle.isPending}
        onConfirm={submit}
        onClose={onClose}
      />
    </>
  );
};

export default BlockUserModal;
