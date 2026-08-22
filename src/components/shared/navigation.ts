import {
  ChartNoAxesCombined,
  CircleUserRound,
  Ellipsis,
  FileText,
  LayoutDashboard,
  ListTree,
  ReceiptText,
  Settings,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Billing", href: "/billing", icon: ReceiptText },
  { label: "Bills", href: "/bills", icon: FileText },
  { label: "Categories", href: "/categories", icon: ListTree },
  { label: "Foods", href: "/foods", icon: UtensilsCrossed },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Users", href: "/users", icon: UsersRound },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: CircleUserRound },
] as const;

export const mobileNavigationItems = [
  navigationItems[0],
  navigationItems[1],
  navigationItems[2],
  navigationItems[4],
  { label: "More", href: "/settings", icon: Ellipsis },
] as const;
