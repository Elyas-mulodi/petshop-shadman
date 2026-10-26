import { Link } from "react-router-dom";
import PageHeader from "../../components/admin/ui/PageHeader";
import Button from "../../components/admin/ui/Button";

const AdminNotFoundPage = () => (
  <>
    <PageHeader title="صفحه پیدا نشد" description="این بخش از پنل وجود ندارد یا هنوز ساخته نشده است." />
    <Link to="/admin">
      <Button variant="primary">بازگشت به داشبورد</Button>
    </Link>
  </>
);

export default AdminNotFoundPage;