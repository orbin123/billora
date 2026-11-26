import type { Bill } from "@/data/workspace";
import type { SalesReport } from "./workspace-commands";

export type Period = "Today" | "Yesterday" | "This week" | "This month" | "Custom range";
export const periods: Period[] = ["Today", "Yesterday", "This week", "This month", "Custom range"];

export function shiftDate(key: string, days: number) {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function periodBounds(period: Exclude<Period, "Custom range">, today: string) {
  if (period === "Today") return { start: today, end: today };
  if (period === "Yesterday") {
    const yesterday = shiftDate(today, -1);
    return { start: yesterday, end: yesterday };
  }
  const daysSinceMonday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  return { start: period === "This week" ? shiftDate(today, -daysSinceMonday) : `${today.slice(0, 7)}-01`, end: today };
}

export function summarizeBills(bills: Bill[]) {
  const revenue = new Map<string, SalesReport["revenue"][number]>();
  const payments = new Map<string, SalesReport["payments"][number]>();
  const totals = new Map<string, SalesReport["totals"][number]>();
  const foods = new Map<string, number>();
  const employees = new Map<string, number>();
  let items = 0;

  for (const bill of bills) {
    const business_day = bill.businessDay;
    const currency = bill.business.currency;
    const amount = Math.round(bill.total * 100);
    const dayKey = `${business_day}:${currency}`;
    const paymentKey = `${bill.payment}:${currency}`;
    totals.set(currency, { currency, amount: (totals.get(currency)?.amount ?? 0) + amount });
    revenue.set(dayKey, { business_day, currency, amount: (revenue.get(dayKey)?.amount ?? 0) + amount });
    payments.set(paymentKey, { payment: bill.payment, currency, amount: (payments.get(paymentKey)?.amount ?? 0) + amount });
    employees.set(bill.cashier, (employees.get(bill.cashier) ?? 0) + 1);
    for (const line of bill.lines) {
      items += line.quantity;
      foods.set(line.name, (foods.get(line.name) ?? 0) + line.quantity);
    }
  }

  return { totals: [...totals.values()], items, revenue: [...revenue.values()], payments: [...payments.values()], foods, employees };
}

const dayLabel = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", timeZone: "UTC" });
export function formatDay(day: string) {
  return dayLabel.format(new Date(`${day}T00:00:00Z`));
}
