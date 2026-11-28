import type { BusinessProfile } from "@/data/business-profile";
import type { Category, Employee, Food, HeldBill, OrderDetails, PaymentMethod, Role } from "@/data/workspace";
import type { reportPermissions } from "@/data/workspace-rules";

export type Checkout = OrderDetails & {
  key: string;
  lines: Pick<Food, "id" | "quantity" | "price">[];
  payment: PaymentMethod;
  received?: number;
  currency: BusinessProfile["currency"];
  gstComponentRate: number;
};

export type WorkspaceAction =
  | { kind: "save-category"; id?: number; name: string; status: Category["status"] }
  | { kind: "remove-category"; id: number }
  | { kind: "save-food"; food: Food }
  | { kind: "remove-food"; id: number }
  | { kind: "save-employee"; employee: Pick<Employee, "id" | "name" | "roleId" | "active"> }
  | { kind: "remove-employee"; id: string }
  | { kind: "provision-employee"; employee: Pick<Employee, "name" | "roleId" | "active"> & { id?: string; username?: string }; password: string }
  | { kind: "save-role"; role: Role }
  | { kind: "remove-role"; id: string }
  | { kind: "checkout"; checkout: Checkout }
  | ({ kind: "edit-bill"; id: string } & OrderDetails)
  | { kind: "remove-bills"; ids?: string[]; day?: string }
  | { kind: "paper"; width: 58 | 80 }
  | { kind: "business"; business: BusinessProfile }
  | { kind: "hold"; bill: HeldBill | null };

export type WorkspaceSnapshot = {
  account: Employee;
  role: Role;
  business: BusinessProfile;
  employees: Employee[];
  roles: Role[];
  categories: Category[];
  foods: Food[];
  paper: 58 | 80;
  heldBill: HeldBill | null;
};

export type ReportPeriod = keyof typeof reportPermissions;
type Amount = { currency: BusinessProfile["currency"]; amount: number };
export type SalesReport = {
  count: number;
  items: number;
  foods: { name: string; items: number }[];
  totals: Amount[];
  revenue: (Amount & { business_day: string })[];
  payments: (Amount & { payment: PaymentMethod })[];
};

export type DashboardSummary = Pick<SalesReport, "count" | "items" | "totals" | "revenue" | "payments"> & {
  foods: [string, number][];
  employees: [string, number][];
  recentBills: { id: string; createdAt: string; total: number; currency: BusinessProfile["currency"] }[];
};
