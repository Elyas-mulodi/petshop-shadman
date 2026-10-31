import {
  FolderTree,
  Gift,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Ticket,
  Users,
  Warehouse,
} from "lucide-react";

export const ADMIN_NAV = [
  {
    title: "نمای کلی",
    items: [{ to: "/admin", label: "داشبورد", icon: LayoutDashboard, ready: true }],
  },
  {
    title: "فروش",
    items: [
      { to: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart, ready: true },
      { to: "/admin/coupons", label: "کدهای تخفیف", icon: Ticket, ready: true },
      { to: "/admin/loyalty", label: "باشگاه مشتریان", icon: Gift, ready: true },
    ],
  },
  {
    title: "کاتالوگ",
    items: [
      { to: "/admin/products", label: "محصولات", icon: Package, ready: true },
      { to: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree, ready: true },
      { to: "/admin/brands", label: "برندها", icon: Tag, ready: true },
      { to: "/admin/inventory", label: "موجودی", icon: Warehouse, ready: false },
    ],
  },
  {
    title: "مشتریان",
    items: [{ to: "/admin/users", label: "کاربران", icon: Users, ready: true }],
  },
];