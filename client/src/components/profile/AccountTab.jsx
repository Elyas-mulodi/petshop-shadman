import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import PersonalInfoForm from "./PersonalInfoForm";
import ChangePasswordForm from "./ChangePasswordForm";
import { Card } from "./ProfileParts";
import { logout as logoutRequest } from "../../features/auth/authApi";
import { logout as logoutAction } from "../../features/auth/authSlice";

const AccountTab = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutRequest(); 
    } catch {
    }
    navigate("/", { replace: true });
    dispatch(logoutAction());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <PersonalInfoForm user={user} />
        <ChangePasswordForm />
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-well text-danger">
            <LogOut className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-paper">
              خروج از حساب
            </h2>
            <p className="mt-1 text-xs leading-6 text-muted">
              برای ورود دوباره به شماره موبایل و رمز عبور نیاز دارید.
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 rounded-lg border border-danger/40 px-6 py-2.5 text-sm text-danger transition-colors hover:bg-danger hover:text-ink disabled:opacity-60"
        >
          {loggingOut && <Loader2 className="h-4 w-4 animate-spin" />}
          خروج
        </button>
      </Card>
    </div>
  );
};

export default AccountTab;
