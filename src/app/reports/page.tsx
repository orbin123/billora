"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleUserRound, IndianRupee, LayoutDashboard, Menu, ReceiptText, Settings, Shapes, UsersRound, UtensilsCrossed, WalletCards, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import common from "../categories/categories.module.css";
import styles from "./reports.module.css";
import tablet from "./reports-tablet.module.css";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

const navigation: Array<{ label: string; icon: Icon; href?: string }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Categories", icon: Shapes, href: "/categories" },
  { label: "Foods", icon: UtensilsCrossed, href: "/foods" },
  { label: "Billing", icon: ReceiptText, href: "/billing" },
  { label: "Today's bills", icon: CalendarDays, href: "/bills" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
  { label: "Users", icon: UsersRound, href: "/users" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const items = [
  { name: "Meals", sales: "620 plates", share: "28%" },
  { name: "Chicken curry", sales: "530 plates", share: "24%" },
  { name: "Fish fry", sales: "410 plates", share: "19%" },
  { name: "Parotta", sales: "380 plates", share: "17%" },
];

export default function ReportsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState("This month");

  return <div className={common.shell}>
    <button className={`${common.scrim} ${menuOpen ? common.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
    <aside className={`${common.sidebar} ${menuOpen ? common.sidebarOpen : ""}`}>
      <div className={common.brandRow}><BrandMark className={common.brandMark} size="sidebar" /><div className={common.brandCopy}><strong>BILLORA</strong><span>All Your Billing, One Place.</span></div><button className={common.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
      <nav className={common.nav} aria-label="Main navigation"><span className={common.navLabel}>Workspace</span>{navigation.map((item) => { const Icon = item.icon; return item.href ? <Link className={`${common.navItem} ${item.label === "Reports" ? common.navItemActive : ""}`} key={item.label} href={item.href} aria-current={item.label === "Reports" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" /><span>{item.label}</span></Link> : <button className={common.navItem} type="button" key={item.label}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>
      <div className={common.sidebarFooter}><div className={common.storeStatus}><i /><span><strong>Hotel Malabar</strong><small>Counter is online</small></span></div></div>
    </aside>
    <main className={common.main}>
      <header className={common.topbar}><div className={common.pageIntro}><button className={common.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Business performance</p><h1>Reports</h1></div></div><div className={common.profileArea}><span className={common.demoBadge}>Demo data</span><button className={common.iconButton} aria-label="Notifications"><Bell /></button><button className={common.profileButton} aria-label="Open profile menu"><span className={common.avatar}><CircleUserRound /></span><span className={common.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span><ChevronDown /></button></div></header>
      <div className={`${common.content} ${styles.content}`}>
        <section className={styles.hero}><div><p className={common.eyebrow}>Sales summary</p><h2>See what&apos;s moving your business</h2><p>Review sales, bills, popular items, and payment mix for the selected period.</p></div><div className={styles.rangePicker} aria-label="Report period">{["Today", "This week", "This month"].map((item) => <button type="button" key={item} className={range === item ? styles.rangeActive : ""} onClick={() => setRange(item)} aria-pressed={range === item}>{item}</button>)}</div></section>
        <section className={styles.summaryGrid} aria-label={`${range} summary`}>
          <article><span className={styles.metricIcon}><IndianRupee /></span><p>Total sales</p><strong>₹3,45,680</strong><small>↑ 12.6% from last month</small></article>
          <article><span className={`${styles.metricIcon} ${styles.blue}`}><ReceiptText /></span><p>Total bills</p><strong>2,450</strong><small>↑ 14.3% from last month</small></article>
          <article><span className={`${styles.metricIcon} ${styles.gold}`}><WalletCards /></span><p>Items sold</p><strong>2,180</strong><small>Across 45 active foods</small></article>
        </section>
        <section className={`${styles.dashboardGrid} ${tablet.tabletLayout}`}>
          <article className={styles.panel}><div className={styles.panelHeader}><div><p className={common.eyebrow}>Revenue trend</p><h2>Sales overview</h2></div><span>₹3.45L total</span></div><div className={styles.barChart} role="img" aria-label="Weekly sales bar chart for this month"><div><i style={{ height: "48%" }} /><span>1–7 Aug</span></div><div><i style={{ height: "82%" }} /><span>8–14 Aug</span></div><div><i style={{ height: "76%" }} /><span>15–21 Aug</span></div><div><i style={{ height: "65%" }} /><span>22–31 Aug</span></div></div></article>
          <article className={styles.panel}><div className={styles.panelHeader}><div><p className={common.eyebrow}>Payment mix</p><h2>How customers paid</h2></div></div><div className={styles.paymentBody}><div className={styles.donut} aria-hidden="true"><span>100%<small>collected</small></span></div><ul><li><span><i className={styles.cash} />Cash</span><b>60%</b></li><li><span><i className={styles.upi} />UPI</span><b>25%</b></li><li><span><i className={styles.phonepe} />PhonePe</span><b>10%</b></li><li><span><i className={styles.card} />Card</span><b>5%</b></li></ul></div></article>
          <article className={`${styles.panel} ${styles.topItems}`}><div className={styles.panelHeader}><div><p className={common.eyebrow}>Menu performance</p><h2>Top-selling foods</h2></div><span>By plates sold</span></div><ol>{items.map((item, index) => <li key={item.name}><b>{index + 1}</b><span>{item.name}<small>{item.sales}</small></span><strong>{item.share}</strong></li>)}</ol></article>
        </section>
        <p className={styles.demoNote}>All values on this page are representative demo data.</p>
      </div>
    </main>
  </div>;
}
