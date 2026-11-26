import type { BusinessProfile } from "./business-profile";
import { calculateAmounts, paymentMethods, type Permission } from "./workspace-rules";

export { allPermissions, paymentMethods, permissionGroups, type Permission } from "./workspace-rules";

export type Role = { id: string; name: string; permissions: Permission[] };
export type Employee = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  inviteCode?: string;
  inviteExpiresAt?: string;
};
export type Category = { id: number; name: string; status: "Active" | "Inactive"; color: string };
export type Food = {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  quantity: number;
  status: "Available" | "Unavailable";
  emoji: string;
  tone: string;
  image?: string;
  version?: number;
};

export type PaymentMethod = (typeof paymentMethods)[number];
export type BillLine = Pick<Food, "id" | "name" | "price" | "quantity">;
export type OrderDetails = { customerName: string; orderType: "Pick Up" | "Dine In" };
export type HeldBill = OrderDetails & { lines: BillLine[] };
export type Bill = OrderDetails & ReturnType<typeof totalsFor> & {
  id: string;
  createdAt: string;
  businessDay: string;
  business: BusinessProfile;
  cashierId: string;
  cashier: string;
  lines: BillLine[];
  payment: PaymentMethod;
  gstRate: number;
  received?: number;
  change?: number;
};

export function totalsFor(lines: BillLine[], business: Pick<BusinessProfile, "currency" | "gstComponentRate">) {
  const amounts = calculateAmounts(
    lines.map(({ price, quantity }) => ({ pricePaise: Math.round(price * 100), quantity })),
    Math.round(business.gstComponentRate * 100),
    business.currency === "INR",
  );
  return {
    subtotal: amounts.subtotalPaise / 100,
    cgst: amounts.componentPaise / 100,
    sgst: amounts.componentPaise / 100,
    roundOff: amounts.roundOffPaise / 100,
    total: amounts.totalPaise / 100,
  };
}
