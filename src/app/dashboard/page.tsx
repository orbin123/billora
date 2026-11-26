"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CalendarDays, ChartNoAxesCombined, ChevronDown, CookingPot, IndianRupee,
  ListPlus, Menu, ReceiptText, Shapes, ShoppingBag, Tags, UsersRound, UtensilsCrossed, WalletCards,
} from "lucide-react";
import { useWorkspace, useWorkspaceResource } from "@/components/workspace-provider";
import { InsightPanel, InsightRows } from "@/components/insight-panel";
import { RevenueOverview } from "@/components/revenue-overview";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { currencyFormatter } from "@/data/business-profile";
import type { DashboardSummary } from "@/lib/workspace-commands";
import { formatDay, periodBounds, periods, type Period } from "@/lib/bill-dates";
import common from "../categories/categories.module.css";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { categories, foods, account, business, money, billTime, businessDate } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [period, setPeriod] = useState<Period>("Today");
  const today = businessDate.format(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const range = period === "Custom range" ? { start, end } : periodBounds(period, today);
  const invalid = !range.start || !range.end || range.start > range.end;
  const dates = invalid ? { start: today, end: today } : range;
  const resource = useWorkspaceResource<DashboardSummary>(`/api/workspace/dashboard?start=${dates.start}&end=${dates.end}`);
  const summary = resource.data;
  const topFoods = summary?.foods.toSorted((a, b) => b[1] - a[1]) ?? [];
  const dateLabel = invalid ? "" : range.start === range.end
    ? formatDay(range.start)
    : `${formatDay(range.start)} – ${formatDay(range.end)}`;
  const metrics = [
    { label: "Total sales", value: summary?.totals.map(({ currency, amount }) => currencyFormatter(currency).format(amount / 100)).join(" · ") || money.format(0), icon: IndianRupee, tone: "sales" },
    { label: "Bills", value: summary?.count, icon: ReceiptText, tone: "bills" },
    { label: "Items sold", value: summary?.items, icon: ShoppingBag, tone: "items" },
  ];
  const quickActions = [
    { label: "New bill", detail: "Start checkout", icon: ListPlus, href: "/billing" },
    { label: "Add food", detail: "Create a menu item", icon: CookingPot, href: "/foods/new" },
    { label: "Add category", detail: "Organize foods", icon: Tags, href: "/categories" },
    { label: "View bills", detail: "Browse history", icon: ReceiptText, href: "/bills" },
  ];

  return <div className={common.shell}>
    <WorkspaceNavigation styles={common} current="/dashboard" open={menuOpen} onClose={closeMenu} />
    <main className={common.main}>
      <header className={common.topbar}>
        <div className={common.pageIntro}>
          <button className={common.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu aria-hidden="true" /></button>
          <div><p>{business.name}</p><h1>Welcome, {account.name}</h1></div>
        </div>
        <WorkspaceProfile styles={common} />
      </header>
      <div className={`${common.content} ${styles.content}`}>
        <section aria-labelledby="overview-title">
          <header className={styles.sectionHeader}>
            <div>
              <h2 id="overview-title">Business overview</h2>
              {dateLabel && <p>{dateLabel}</p>}
            </div>
            <label className={styles.period}>
              <CalendarDays aria-hidden="true" />
              <select aria-label="Date range" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
                {periods.map((value) => <option key={value}>{value}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
          </header>
          {period === "Custom range" && <div className={styles.dateFields}>
            <label className="workspace-field">Start date<input required type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
            <label className="workspace-field">End date<input required type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
          </div>}
          {invalid && <p role="alert" className={styles.dateError}>Choose both dates. The end date must be on or after the start date.</p>}

          <div className={styles.metrics} aria-live="polite">
            {metrics.map(({ icon: Icon, label, value, tone }) => <article className={`${styles.metric} ${styles[tone]}`} key={label}>
              <span className={styles.metricIcon}><Icon aria-hidden="true" /></span>
              <div><p>{label}</p><strong>{invalid || !resource.data ? "—" : value}</strong></div>
            </article>)}
            <article className={styles.catalogue} aria-label="Menu counts">
              <div><CookingPot aria-hidden="true" /><span>Foods</span><strong>{foods.length}</strong></div>
              <div><Shapes aria-hidden="true" /><span>Categories</span><strong>{categories.length}</strong></div>
            </article>
          </div>
        </section>

        <section aria-labelledby="activity-title">
          <div className={styles.sectionHeader}><h2 id="activity-title">Sales and activity</h2></div>
          {!invalid && resource.error && <p role="alert">{resource.error}</p>}
          {!invalid && !resource.data && !resource.error && <p role="status">Loading sales…</p>}
          {!invalid && summary && <div className={styles.insights} key={`${range.start}/${range.end}`}>
            <InsightPanel title="Revenue overview" icon={ChartNoAxesCombined} className={styles.revenue}>
              <RevenueOverview revenue={summary.revenue} />
            </InsightPanel>
            <InsightPanel title="Top-selling foods" icon={UtensilsCrossed}>
              <InsightRows label="Top-selling foods" ranked rows={topFoods.map(([label, quantity], index) => ({ label, value: `${quantity} sold`, mark: index + 1 }))} empty="No foods sold in this period." />
            </InsightPanel>
            <InsightPanel title="Payment methods" icon={WalletCards}>
              <InsightRows label="Payment methods" rows={summary.payments.map(({ payment, currency, amount }) => ({ label: `${payment} · ${currency}`, value: currencyFormatter(currency).format(amount / 100) }))} empty="No payments in this period." />
            </InsightPanel>
            <InsightPanel title="Recent bills" icon={ReceiptText} className={styles.history} action={<Link className={styles.inlineLink} href="/bills">View bills <ArrowRight aria-hidden="true" /></Link>}>
              <InsightRows label="Recent bills" rows={summary.recentBills.map((bill) => ({ label: bill.id, value: currencyFormatter(bill.currency).format(bill.total), detail: billTime.format(new Date(bill.createdAt)) }))} empty="No recent bills in this period." />
            </InsightPanel>
            <InsightPanel title="Employee activity" icon={UsersRound} className={styles.activity}>
              <InsightRows label="Employee activity" rows={[...summary.employees].map(([label, count]) => ({ label, value: `${count} ${count === 1 ? "bill" : "bills"}` }))} empty="No employee activity in this period." />
            </InsightPanel>
          </div>}
        </section>
        {quickActions.length > 0 && <section aria-labelledby="quick-title">
          <div className={styles.sectionHeader}><h2 id="quick-title">Quick actions</h2></div>
          <div className={styles.actionGrid}>
            {quickActions.map(({ icon: Icon, label, detail, href }) => <Link className={styles.action} href={href} key={href} data-primary={href === "/billing" ? "" : undefined}>
              <span className={styles.actionIcon}><Icon aria-hidden="true" /></span>
              <span className={styles.actionCopy}><strong>{label}</strong><small>{detail}</small></span>
              <ArrowRight className={styles.actionArrow} aria-hidden="true" />
            </Link>)}
          </div>
        </section>}
      </div>
    </main>
  </div>;
}
