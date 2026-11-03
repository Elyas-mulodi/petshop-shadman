import { useState } from "react";
import { StickyNote } from "lucide-react";
import Button from "../ui/Button";
import { useToast } from "../ui/ToastProvider";
import { TextAreaField } from "../../checkout/FormControls";
import { Card } from "../../profile/ProfileParts";
import { useAddUserNote } from "../../../features/admin/users/useAdminUsers";
import { formatDateTime } from "../../../utils/formatDate";
import { parseApiError } from "../../../utils/authHelpers";

const UserNotesCard = ({ userId, notes }) => {
  const toast = useToast();
  const mutation = useAddUserNote(userId);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const list = [...notes].reverse();

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");

    mutation.mutate(
      { text: text.trim() },
      {
        onSuccess: () => {
          setText("");
          toast.success("یادداشت ثبت شد");
        },
        onError: (err) => setError(parseApiError(err).message),
      },
    );
  };

  return (
    <Card
      icon={StickyNote}
      title="یادداشت داخلی"
      hint="فقط ادمین‌ها می‌بینند و بعد از ثبت قابل ویرایش یا حذف نیست."
    >
      <form onSubmit={submit} noValidate>
        <TextAreaField
          label="یادداشت جدید"
          value={text}
          maxLength={1000}
          error={error}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          loading={mutation.isPending}
          disabled={!text.trim()}
        >
          ثبت یادداشت
        </Button>
      </form>

      {list.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-line pt-5">
          {list.map((note) => (
            <li key={note._id} className="rounded-lg bg-ink px-3.5 py-3">
              <p className="whitespace-pre-wrap text-sm leading-7 text-paper">
                {note.text}
              </p>
              <p className="mt-2 text-[11px] text-muted">
                {note.by?.name || note.by?.phone || "ادمین"} ،{" "}
                {formatDateTime(note.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default UserNotesCard;
