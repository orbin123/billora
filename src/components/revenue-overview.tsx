import { CalendarDays } from "lucide-react";
import { currencyFormatter } from "@/data/business-profile";
import { formatDay } from "@/lib/bill-dates";
import type { SalesReport } from "@/lib/workspace-commands";
import { InsightList } from "./insight-list";
import { InsightEmpty } from "./insight-panel";
import styles from "./insights.module.css";

export function RevenueOverview({ revenue }: { revenue: SalesReport["revenue"] }) {
  if (!revenue.length) return <InsightEmpty>No completed bills in this period.</InsightEmpty>;

  return [...new Set(revenue.map(({ currency }) => currency))].map((currency) => {
    const days = revenue.filter((row) => row.currency === currency)
      .sort((a, b) => b.business_day.localeCompare(a.business_day));
    const maximum = Math.max(1, ...days.map(({ amount }) => amount));
    const total = days.reduce((sum, { amount }) => sum + amount, 0);
    const money = currencyFormatter(currency);
    return <div key={currency}>
      <strong className={styles.revenueTotal}>{money.format(total / 100)}</strong>
      {days.length === 1
        ? <time className={styles.revenueDate} dateTime={days[0].business_day}><CalendarDays aria-hidden="true" />{formatDay(days[0].business_day)}</time>
        : <InsightList items={days} label={`Revenue by day in ${currency}`} className={styles.bars}
          renderItem={({ business_day: day, amount }) => <li key={day}>
            <time dateTime={day}>{formatDay(day)}</time>
            <div className={styles.track} aria-hidden="true"><span style={{ width: `${(amount / maximum) * 100}%` }} /></div>
            <strong>{money.format(amount / 100)}</strong>
          </li>} />}
    </div>;
  });
}
