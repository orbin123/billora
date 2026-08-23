"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleUserRound, CookingPot,
  IndianRupee, LayoutDashboard, ListPlus, LogOut, Menu,
  ReceiptText, Settings, Shapes, ShoppingBag, Tags, TrendingUp,
  UsersRound, UtensilsCrossed, X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import styles from "./dashboard.module.css";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

const navigation: Array<{ label: string; icon: Icon; active?: boolean; href?: string }> = [
  { label: "Dashboard", icon: LayoutDashboard, active: true, href: "/dashboard" },
  { label: "Categories", icon: Shapes, href: "/categories" },
  { label: "Foods", icon: UtensilsCrossed, href: "/foods" },
  { label: "Billing", icon: ReceiptText, href: "/billing" },
  { label: "Today's bills", icon: CalendarDays, href: "/bills" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
  { label: "Users", icon: UsersRound, href: "/users" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const metrics: Array<{ label: string; value: string; change: string; icon: Icon; tone: "green" | "blue" | "gold" | "violet" }> = [
  { label: "Today's sales", value: "₹12,450", change: "+12.5%", icon: IndianRupee, tone: "green" },
  { label: "Today's bills", value: "86", change: "+8.8%", icon: ReceiptText, tone: "blue" },
  { label: "Plates sold", value: "158", change: "+15.3%", icon: ShoppingBag, tone: "gold" },
  { label: "Active foods", value: "45", change: "+3.4%", icon: CookingPot, tone: "violet" },
];

const topItems = [
  { name: "Meals", orders: "120 orders", emoji: "🍛", tone: "saffron" },
  { name: "Chicken curry", orders: "89 orders", emoji: "🍲", tone: "terracotta" },
  { name: "Fish fry", orders: "74 orders", emoji: "🐟", tone: "mint" },
  { name: "Egg curry", orders: "63 orders", emoji: "🥘", tone: "yellow" },
  { name: "Parotta", orders: "52 orders", emoji: "🫓", tone: "cream" },
];

const quickActions: Array<{ label: string; detail: string; icon: Icon; tone: string; href?: string }> = [
  { label: "New bill", detail: "Start checkout", icon: ListPlus, tone: "ink", href: "/billing" },
  { label: "Add food", detail: "Create a menu item", icon: CookingPot, tone: "green", href: "/foods" },
  { label: "Add category", detail: "Organize foods", icon: Tags, tone: "mint", href: "/categories" },
  { label: "View bills", detail: "Browse history", icon: ReceiptText, tone: "gold", href: "/bills" },
];

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [range, setRange] = useState("Today");

  return (
    <div className={styles.shell}>
      <button className={`${styles.scrim} ${menuOpen ? styles.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          <BrandMark className={styles.brandMark} size="sidebar" />
          <div className={styles.brandCopy}>
            <strong>BILLORA</strong>
            <span>All Your Billing, One Place.</span>
          </div>
          <button className={styles.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X aria-hidden="true" /></button>
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          <span className={styles.navLabel}>Workspace</span>
          {navigation.map((item) => {
            const Icon = item.icon;
            const content = <><Icon aria-hidden="true" /><span>{item.label}</span></>;
            return item.href ? (
              <Link className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`} href={item.href} key={item.label} aria-current={item.active ? "page" : undefined} title={item.label} onClick={() => setMenuOpen(false)}>
                {content}
              </Link>
            ) : (
              <button className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`} key={item.label} type="button" aria-current={item.active ? "page" : undefined} title={item.label}>
                {content}
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.storeStatus}>
            <span className={styles.statusDot} />
            <span><strong>Hotel Malabar</strong><small>Counter is online</small></span>
          </div>
          <button className={styles.logoutButton} type="button"><LogOut aria-hidden="true" /><span>Log out</span></button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.welcomeGroup}>
            <button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu aria-hidden="true" /></button>
            <div><p>Sunday, 23 August</p><h1>Welcome back, Admin <span aria-hidden="true">👋</span></h1></div>
          </div>

          <div className={styles.profileArea}>
            <div className={styles.demoBadge}>Demo data</div>
            <button className={styles.iconButton} type="button" aria-label="Notifications"><Bell aria-hidden="true" /><span className={styles.notificationDot} /></button>
            <button className={styles.profileButton} type="button" aria-label="Open profile menu">
              <span className={styles.avatar}><CircleUserRound aria-hidden="true" /></span>
              <span className={styles.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span>
              <ChevronDown className={styles.profileChevron} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.metricGrid} aria-label="Today's overview">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article className={styles.metricCard} key={metric.label}>
                  <div className={`${styles.metricIcon} ${styles[metric.tone]}`}><Icon aria-hidden="true" /></div>
                  <div className={styles.metricHeading}><p>{metric.label}</p><span><TrendingUp aria-hidden="true" /> {metric.change}</span></div>
                  <strong className={styles.metricValue}>{metric.value}</strong><small>vs. yesterday</small>
                </article>
              );
            })}
          </section>

          <section className={styles.insightGrid}>
            <article className={`${styles.panel} ${styles.chartPanel}`}>
              <div className={styles.panelHeader}>
                <div><p className={styles.eyebrow}>Performance</p><h2>Sales overview</h2></div>
                <div className={styles.rangeControl} aria-label="Sales period">
                  {["Today", "Week", "Month"].map((item) => (
                    <button type="button" key={item} className={range === item ? styles.rangeActive : ""} onClick={() => setRange(item)} aria-pressed={range === item}>{item}</button>
                  ))}
                </div>
              </div>

              <div className={styles.chartSummary}><strong>₹12,450</strong><span><TrendingUp aria-hidden="true" /> 12.5%</span><small>for {range.toLowerCase()}</small></div>
              <div className={styles.chart} role="img" aria-label="Sales rise from two thousand rupees at 12 AM to twelve thousand four hundred fifty rupees at 12 AM">
                <div className={styles.yLabels} aria-hidden="true"><span>₹15k</span><span>₹10k</span><span>₹5k</span><span>₹0</span></div>
                <div className={styles.chartPlot}>
                  <div className={styles.gridLines} aria-hidden="true"><i /><i /><i /><i /></div>
                  <svg viewBox="0 0 700 230" preserveAspectRatio="none" aria-hidden="true">
                    <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#087747" stopOpacity="0.22" /><stop offset="100%" stopColor="#087747" stopOpacity="0" /></linearGradient></defs>
                    <path className={styles.areaPath} d="M0,205 L55,178 L110,165 L165,112 L220,145 L275,83 L330,132 L385,118 L440,76 L495,63 L550,95 L605,82 L660,25 L700,12 L700,230 L0,230 Z" />
                    <path className={styles.linePath} d="M0,205 L55,178 L110,165 L165,112 L220,145 L275,83 L330,132 L385,118 L440,76 L495,63 L550,95 L605,82 L660,25 L700,12" />
                    {["0,205", "110,165", "220,145", "330,132", "440,76", "550,95", "660,25", "700,12"].map((point) => { const [cx, cy] = point.split(","); return <circle key={point} cx={cx} cy={cy} r="4" className={styles.chartPoint} />; })}
                  </svg>
                  <div className={styles.xLabels} aria-hidden="true"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span></div>
                </div>
              </div>
            </article>

            <article className={`${styles.panel} ${styles.sellersPanel}`}>
              <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Popular today</p><h2>Top-selling foods</h2></div><button className={styles.textButton} type="button">View report</button></div>
              <ol className={styles.sellerList}>
                {topItems.map((item, index) => (
                  <li key={item.name}><span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span><span className={`${styles.foodThumb} ${styles[item.tone]}`} aria-hidden="true">{item.emoji}</span><span className={styles.foodCopy}><strong>{item.name}</strong><small>{item.orders}</small></span><span className={styles.foodTrend}>+{12 - index * 2}%</span></li>
                ))}
              </ol>
            </article>
          </section>

          <section className={styles.quickSection}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Shortcuts</p><h2>Quick actions</h2></div><p>Jump straight into your most common tasks.</p></div>
            <div className={styles.actionGrid}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                const content = <><span className={`${styles.actionIcon} ${styles[action.tone]}`}><Icon aria-hidden="true" /></span><span><strong>{action.label}</strong><small>{action.detail}</small></span><span className={styles.actionArrow} aria-hidden="true">↗</span></>;
                return action.href ? <Link className={styles.actionCard} href={action.href} key={action.label}>{content}</Link> : <button className={styles.actionCard} type="button" key={action.label}>{content}</button>;
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
