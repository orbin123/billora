"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, CircleUserRound, LayoutDashboard, Menu, MoreHorizontal, Plus, ReceiptText, Search, Settings, Shapes, Trash2, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import styles from "../categories/categories.module.css";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;
type Food = { id: number; name: string; category: string; price: number; status: "Available" | "Unavailable"; emoji: string; color: string };

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

const initialFoods: Food[] = [
  { id: 1, name: "Meals", category: "Rice & meals", price: 70, status: "Available", emoji: "🍚", color: "rice" },
  { id: 2, name: "Chicken curry", category: "Curries", price: 110, status: "Available", emoji: "🍛", color: "curry" },
  { id: 3, name: "Fish fry", category: "Fish & seafood", price: 120, status: "Available", emoji: "🐟", color: "fish" },
  { id: 4, name: "Egg curry", category: "Curries", price: 75, status: "Available", emoji: "🥘", color: "curry" },
  { id: 5, name: "Parotta", category: "Breads & sides", price: 20, status: "Available", emoji: "🫓", color: "bread" },
  { id: 6, name: "Lime juice", category: "Beverages", price: 35, status: "Unavailable", emoji: "🥤", color: "drink" },
];

export default function FoodsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [foods, setFoods] = useState(initialFoods);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Available" | "Unavailable">("All");
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
  const [notice, setNotice] = useState("");
  const visibleFoods = useMemo(() => foods.filter((food) => (filter === "All" || food.status === filter) && food.name.toLowerCase().includes(query.trim().toLowerCase())), [foods, filter, query]);

  const removeFood = () => { if (!deleteTarget) return; setFoods((current) => current.filter((food) => food.id !== deleteTarget.id)); setNotice(`${deleteTarget.name} was deleted`); setDeleteTarget(null); };

  return <div className={styles.shell}>
    <button className={`${styles.scrim} ${menuOpen ? styles.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
    <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}><div className={styles.brandRow}><BrandMark className={styles.brandMark} size="sidebar" /><div className={styles.brandCopy}><strong>BILLORA</strong><span>All Your Billing, One Place.</span></div><button className={styles.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div><nav className={styles.nav} aria-label="Main navigation"><span className={styles.navLabel}>Workspace</span>{navigation.map((item) => { const Icon = item.icon; const content = <><Icon /><span>{item.label}</span></>; return item.href ? <Link className={`${styles.navItem} ${item.label === "Foods" ? styles.navItemActive : ""}`} key={item.label} href={item.href} aria-current={item.label === "Foods" ? "page" : undefined} onClick={() => setMenuOpen(false)}>{content}</Link> : <button className={styles.navItem} type="button" key={item.label}>{content}</button>; })}</nav><div className={styles.sidebarFooter}><div className={styles.storeStatus}><i /><span><strong>Hotel Malabar</strong><small>Counter is online</small></span></div></div></aside>
    <main className={styles.main}><header className={styles.topbar}><div className={styles.pageIntro}><button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Menu setup</p><h1>Foods</h1></div></div><div className={styles.profileArea}><span className={styles.demoBadge}>Demo data</span><button className={styles.iconButton} aria-label="Notifications"><Bell /></button><button className={styles.profileButton} aria-label="Open profile menu"><span className={styles.avatar}><CircleUserRound /></span><span className={styles.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span><ChevronDown /></button></div></header>
      <div className={styles.content}><section className={styles.hero}><div><p className={styles.eyebrow}>Menu management</p><h2>Keep every menu item ready to sell</h2><p className={styles.heroCopy}>Add, review, and organize the foods your team uses while creating bills.</p></div><Link className={styles.addButton} href="/foods/new"><Plus /> Add food</Link></section>
      {notice && <div className={styles.notice} role="status"><Check />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}
      <section className={`${styles.categoryPanel} ${styles.foodPanel}`}><div className={styles.panelHeader}><div><h2>All foods <span>{foods.length}</span></h2><p>These are sample items for your demo workspace.</p></div><div className={styles.tools}><label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods" /></label><div className={styles.filters}>{(["All", "Available", "Unavailable"] as const).map((value) => <button type="button" key={value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{value}</button>)}</div></div></div>
        <div className={`${styles.tableHeader} ${styles.foodTableHeader}`}><span>Food</span><span>Category</span><span>Price</span><span>Status</span><span>Actions</span></div><div className={styles.categoryList}>{visibleFoods.length ? visibleFoods.map((food) => <article className={`${styles.categoryRow} ${styles.foodRow}`} key={food.id}><div className={styles.categoryName}><span className={`${styles.foodThumb} ${styles[food.color]}`}>{food.emoji}</span><div><strong>{food.name}</strong><small>Food #{String(food.id).slice(-4).padStart(4, "0")}</small></div></div><span className={styles.categoryText}>{food.category}</span><strong className={styles.foodPrice}>₹{food.price.toLocaleString("en-IN")}</strong><span className={`${styles.status} ${food.status === "Available" ? styles.statusActive : styles.statusInactive}`}><i />{food.status}</span><div className={styles.rowActions}><button type="button" className={styles.moreButton} aria-label={`More actions for ${food.name}`}><MoreHorizontal /></button><button type="button" className={styles.deleteButton} onClick={() => setDeleteTarget(food)} aria-label={`Delete ${food.name}`}><Trash2 /></button></div></article>) : <div className={styles.emptyState}><UtensilsCrossed /><strong>No foods found</strong><span>Try a different search or add a food item.</span></div>}</div><footer className={styles.panelFooter}>Showing {visibleFoods.length} of {foods.length} foods</footer></section></div></main>
    {deleteTarget && <div className={styles.dialogBackdrop}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className={styles.dialogIcon}><Trash2 /></div><h2 id="delete-title">Delete {deleteTarget.name}?</h2><p>This removes the food from this demo screen. It cannot be undone.</p><div><button className={styles.cancelButton} type="button" onClick={() => setDeleteTarget(null)}>Keep food</button><button className={styles.confirmDelete} type="button" onClick={removeFood}>Delete food</button></div></section></div>}
  </div>;
}
