export const permissionGroups = {
  Products: ["View products", "Add products", "Edit products", "Delete products", "Upload product images"],
  Billing: ["View bills", "Create bills", "Edit bills", "Delete bills", "Print bills"],
  Reports: ["View daily reports", "View weekly reports", "View monthly reports", "Export reports"],
} as const;

export type Permission = (typeof permissionGroups)[keyof typeof permissionGroups][number];
export const allPermissions: Permission[] = Object.values(permissionGroups).flat();
export const reportPermissions = {
  Today: "View daily reports",
  "This week": "View weekly reports",
  "This month": "View monthly reports",
} satisfies Record<string, Permission>;

export const paymentMethods = ["Cash", "UPI", "GPay", "PhonePe", "Card"] as const;

export function calculateAmounts(lines: { pricePaise: number; quantity: number }[], componentBps: number, roundToUnit: boolean) {
  const subtotalPaise = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
  // Match checkout's round-half-to-even policy for each component.
  const rawComponent = subtotalPaise * componentBps;
  const wholeTaxPaise = Math.floor(rawComponent / 10000);
  const remainder = rawComponent % 10000;
  const componentPaise = wholeTaxPaise + Number(remainder > 5000 || (remainder === 5000 && wholeTaxPaise % 2 === 1));
  const amountBeforeRoundOff = subtotalPaise + 2 * componentPaise;
  const totalPaise = roundToUnit ? Math.round(amountBeforeRoundOff / 100) * 100 : amountBeforeRoundOff;

  return { subtotalPaise, componentPaise, roundOffPaise: totalPaise - amountBeforeRoundOff, totalPaise };
}
