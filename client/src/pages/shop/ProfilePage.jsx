import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Gift, Package, User } from "lucide-react";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileTabs from "../../components/profile/ProfileTabs";
import OrdersTab from "../../components/profile/OrdersTab";
import LoyaltyTab from "../../components/profile/LoyaltyTab";
import AccountTab from "../../components/profile/AccountTab";
import useMyOrders from "../../features/orders/useMyOrders";
import { getProfile } from "../../features/auth/authApi";
import { updateUser } from "../../features/auth/authSlice";

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"];
const TAB_IDS = ["orders", "loyalty", "account"];

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, loading, error, reload, patchOrder } = useMyOrders();

  const requested = searchParams.get("tab");
  const tab = TAB_IDS.includes(requested) ? requested : "orders";

  useEffect(() => {
    getProfile()
      .then((res) => dispatch(updateUser(res.data.data)))
      .catch(() => {});
  }, [dispatch]);

  const stats = useMemo(
    () => ({
      ordersCount: orders.length,
      totalSpent: orders
        .filter((o) => PAID_STATUSES.includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0),
      pendingCount: orders.filter((o) => o.status === "pending_payment").length,
    }),
    [orders],
  );

  const tabs = [
    {
      id: "orders",
      label: "سفارش‌ها",
      icon: Package,
      badge: stats.pendingCount,
    },
    { id: "loyalty", label: "باشگاه مشتریان", icon: Gift },
    { id: "account", label: "حساب کاربری", icon: User },
  ];

  const changeTab = (id) => setSearchParams({ tab: id }, { replace: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-12">
      <ProfileHeader
        user={user}
        stats={stats}
        statsLoading={loading || !!error}
        onEdit={() => changeTab("account")}
      />

      <div className="mt-6">
        <ProfileTabs tabs={tabs} active={tab} onChange={changeTab} />
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "orders" && (
              <OrdersTab
                orders={orders}
                loading={loading}
                error={error}
                onReload={reload}
                onPatchOrder={patchOrder}
              />
            )}
            {tab === "loyalty" && <LoyaltyTab user={user} />}
            {tab === "account" && <AccountTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;
