"use client";

import { useCallback, useState } from "react";
import { Download, ChartNoAxesCombined, IndianRupee, Menu, ReceiptText, UtensilsCrossed, WalletCards } from "lucide-react";
import { useWorkspace, useWorkspaceResource } from "@/components/workspace-provider";
import { InsightPanel, InsightRows } from "@/components/insight-panel";
import { RevenueOverview } from "@/components/revenue-overview";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { currencyFormatter } from "@/data/business-profile";
import { reportPermissions } from "@/data/workspace-rules";
import type { ReportPeriod, SalesReport } from "@/lib/workspace-commands";
import { Button } from "@/components/ui/button";
import common from "../categories/categories.module.css";
import styles from "./reports.module.css";

const reportPeriods = Object.keys(reportPermissions) as ReportPeriod[];

export default function ReportsPage() {
  const { allows, money } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [selection, setSelection] = useState<ReportPeriod>("Today");
  const available = reportPeriods.filter((period) => allows(reportPermissions[period]));
  const period = available.includes(selection) ? selection : available[0];
  const { data: summary, error } = useWorkspaceResource<SalesReport>(`/api/workspace/report?period=${encodeURIComponent(period)}`);

  return <div className={common.shell}>
    <WorkspaceNavigation styles={common} current="/reports" open={menuOpen} onClose={closeMenu} />
    <main className={common.main}>
      <header className={common.topbar}><div className={common.pageIntro}>
        <button className={common.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
        <div><p>Business performance</p><h1>Reports</h1></div>
      </div><WorkspaceProfile styles={common} /></header>
      <div className={`${common.content} ${styles.content}`}>
        <section className={styles.hero}><div><h2>Sales summary</h2></div>
          <div className={styles.rangePicker} aria-label="Report period">
            {available.map((value) => <button type="button" key={value} className={period === value ? styles.rangeActive : ""} onClick={() => setSelection(value)} aria-pressed={period === value}>{value}</button>)}
          </div>
          {summary && allows("Export reports") && <Button variant="outline" onClick={() => exportReport(summary, period)}><Download /> Export CSV</Button>}
        </section>
        {error && <p role="alert">{error}</p>}
        {!summary && !error && <p role="status">Loading report…</p>}
        {summary && <>
        <section className={styles.summaryGrid} aria-label={`${period} summary`}>
          <article><span className={styles.metricIcon}><IndianRupee /></span><p>Total sales</p><strong>{summary.totals.map(({ currency, amount }) => currencyFormatter(currency).format(amount / 100)).join(" · ") || money.format(0)}</strong></article>
          <article><span className={`${styles.metricIcon} ${styles.blue}`}><ReceiptText /></span><p>Total bills</p><strong>{summary.count}</strong></article>
          <article><span className={`${styles.metricIcon} ${styles.gold}`}><WalletCards /></span><p>Items sold</p><strong>{summary.items}</strong></article>
        </section>
        <section className={styles.dashboardGrid} key={period} aria-label="Sales breakdown">
          <InsightPanel title="Revenue overview" icon={ChartNoAxesCombined}><RevenueOverview revenue={summary.revenue} /></InsightPanel>
          <InsightPanel title="Payment methods" icon={WalletCards}>
            <InsightRows label="Payment methods" rows={summary.payments.map(({ payment, currency, amount }) => ({ label: `${payment} · ${currency}`, value: currencyFormatter(currency).format(amount / 100) }))} empty="No payments in this period." />
          </InsightPanel>
          <InsightPanel title="Top-selling foods" icon={UtensilsCrossed} className={styles.sellers}>
            <InsightRows label="Top-selling foods" ranked rows={summary.foods.map(({ name, items }, index) => ({ label: name, value: `${items} sold`, mark: index + 1 }))} empty="No foods sold in this period." />
          </InsightPanel>
        </section>
        </>}
      </div>
    </main>
  </div>;
}

function exportReport(report: SalesReport, period: ReportPeriod) {
  const rows = [
    ["Section", "Label", "Currency", "Value"],
    ["Summary", "Bills", "", report.count],
    ["Summary", "Items sold", "", report.items],
    ...report.totals.map(({ currency, amount }) => ["Summary", "Total sales", currency, (amount / 100).toFixed(2)]),
    ...report.revenue.map(({ business_day, currency, amount }) => ["Daily sales", business_day, currency, (amount / 100).toFixed(2)]),
    ...report.payments.map(({ payment, currency, amount }) => ["Payment", payment, currency, (amount / 100).toFixed(2)]),
    ...report.foods.map(({ name, items }) => ["Item", name, "", items]),
  ];
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value);
    const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(",")).join("\r\n");
  const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = href;
  link.download = `billora-${period.toLowerCase().replaceAll(" ", "-")}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
