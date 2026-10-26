import { Link } from "react-router-dom";
import PageHeader from "../../components/admin/ui/PageHeader";
import Button from "../../components/admin/ui/Button";

const AdminDashboardPage = () => (
  <>
    <PageHeader title="داشبورد" description="خلاصه‌ی عملکرد فروشگاه" />
    <div className="rounded-2xl border border-line bg-card p-8 text-center">
      <p className="font-display text-lg font-bold text-paper">داشبورد گزارش‌ها در فاز بعد ساخته می‌شود</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">
        فعلاً بخش کاربران فعاله. بقیه‌ی بخش‌ها با تکمیل هر فاز در منوی کناری فعال می‌شن.
      </p>
      <Link to="/admin/users" className="mt-6 inline-block">
        <Button variant="primary">مدیریت کاربران</Button>
      </Link>
    </div>
  </>
);

export default AdminDashboardPage;