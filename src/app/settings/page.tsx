"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { Bell, Building2, ChartNoAxesCombined, ChevronDown, ChevronRight, CircleHelp, CircleUserRound, DatabaseBackup, LayoutDashboard, Menu, ReceiptText, Settings, Shapes, ShieldCheck, SlidersHorizontal, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import common from "../categories/categories.module.css";
import styles from "./settings.module.css";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

const navigation: Array<{ label: string; icon: Icon; href?: string }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Categories", icon: Shapes, href: "/categories" },
  { label: "Foods", icon: UtensilsCrossed, href: "/foods" },
  { label: "Billing", icon: ReceiptText, href: "/billing" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
  { label: "Users", icon: UsersRound, href: "/users" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const settingItems: Array<{ title: string; detail: string; icon: Icon; tone: "green" | "gold" | "blue" | "mint" }> = [
  { title: "Business information", detail: "Business name, address, contact details, and receipt header", icon: Building2, tone: "green" },
  { title: "Tax & charges", detail: "GST, service charge, and how taxes appear on bills", icon: ShieldCheck, tone: "gold" },
  { title: "Printer settings", detail: "Receipt format and your connected counter printer", icon: ReceiptText, tone: "blue" },
  { title: "Backup & restore", detail: "Keep a safe copy of your business data", icon: DatabaseBackup, tone: "mint" },
  { title: "General settings", detail: "Currency, date format, and workspace preferences", icon: SlidersHorizontal, tone: "green" },
  { title: "About Billora", detail: "App version, help, and product information", icon: CircleHelp, tone: "blue" },
];

export default function SettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={common.shell}>
    <button className={`${common.scrim} ${menuOpen ? common.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
    <aside className={`${common.sidebar} ${menuOpen ? common.sidebarOpen : ""}`}><div className={common.brandRow}><BrandMark className={common.brandMark} size="sidebar" /><div className={common.brandCopy}><strong>BILLORA</strong><span>All Your Billing, One Place.</span></div><button className={common.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div><nav className={common.nav} aria-label="Main navigation"><span className={common.navLabel}>Workspace</span>{navigation.map((item) => { const Icon = item.icon; return <Link className={`${common.navItem} ${item.label === "Settings" ? common.navItemActive : ""}`} key={item.label} href={item.href ?? "#"} aria-current={item.label === "Settings" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" /><span>{item.label}</span></Link>; })}</nav><div className={common.sidebarFooter}><div className={common.storeStatus}><i /><span><strong>Hotel Malabar</strong><small>Counter is online</small></span></div></div></aside>
    <main className={common.main}><header className={common.topbar}><div className={common.pageIntro}><button className={common.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Workspace preferences</p><h1>Settings</h1></div></div><div className={common.profileArea}><span className={common.demoBadge}>Demo data</span><button className={common.iconButton} aria-label="Notifications"><Bell /></button><button className={common.profileButton} aria-label="Open profile menu"><span className={common.avatar}><CircleUserRound /></span><span className={common.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span><ChevronDown /></button></div></header>
      <div className={common.content}><section className={common.hero}><div><p className={common.eyebrow}>Workspace setup</p><h2>Set up Billora your way</h2><p className={common.heroCopy}>Manage the essentials for your counter, bills, and daily operations from one calm workspace.</p></div></section><section className={styles.settingsPanel} aria-label="Settings options"><div className={styles.panelIntro}><h2>Settings</h2><p>Choose an area to review its options.</p></div><div className={styles.settingsList}>{settingItems.map((item) => { const Icon = item.icon; return <button className={styles.settingRow} type="button" key={item.title}><span className={`${styles.settingIcon} ${styles[item.tone]}`}><Icon aria-hidden="true" /></span><span className={styles.settingCopy}><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight aria-hidden="true" /></button>; })}</div></section></div>
    </main>
  </div>;
}
