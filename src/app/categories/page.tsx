"use client";

import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, CircleUserRound, CookingPot, LayoutDashboard, Menu, MoreHorizontal, Plus, ReceiptText, Search, Settings, Shapes, Tags, Trash2, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import styles from "./categories.module.css";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;
type Category = { id: number; name: string; items: number; status: "Active" | "Inactive"; color: string };

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

const initialCategories: Category[] = [
  { id: 1, name: "Rice & meals", items: 12, status: "Active", color: "rice" },
  { id: 2, name: "Curries", items: 9, status: "Active", color: "curry" },
  { id: 3, name: "Fish & seafood", items: 6, status: "Active", color: "fish" },
  { id: 4, name: "Breads & sides", items: 7, status: "Active", color: "bread" },
  { id: 5, name: "Beverages", items: 10, status: "Active", color: "drink" },
  { id: 6, name: "Seasonal specials", items: 0, status: "Inactive", color: "special" },
];

export default function CategoriesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");

  const visibleCategories = useMemo(() => categories.filter((category) => {
    const matchesQuery = category.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All" || category.status === filter;
    return matchesQuery && matchesFilter;
  }), [categories, filter, query]);

  const addCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCategories((current) => [...current, { id: Date.now(), name, items: 0, status: "Active", color: "special" }]);
    setNewName("");
    setAdding(false);
    setNotice(`${name} was added`);
  };

  const removeCategory = () => {
    if (!deleteTarget) return;
    setCategories((current) => current.filter((category) => category.id !== deleteTarget.id));
    setNotice(`${deleteTarget.name} was deleted`);
    setDeleteTarget(null);
  };

  return (
    <div className={styles.shell}>
      <button className={`${styles.scrim} ${menuOpen ? styles.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}><BrandMark className={styles.brandMark} size="sidebar" /><div className={styles.brandCopy}><strong>BILLORA</strong><span>All Your Billing, One Place.</span></div><button className={styles.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
        <nav className={styles.nav} aria-label="Main navigation"><span className={styles.navLabel}>Workspace</span>{navigation.map((item) => { const Icon = item.icon; const content = <><Icon aria-hidden="true" /><span>{item.label}</span></>; return item.href ? <Link key={item.label} className={`${styles.navItem} ${item.label === "Categories" ? styles.navItemActive : ""}`} href={item.href} aria-current={item.label === "Categories" ? "page" : undefined} onClick={() => setMenuOpen(false)}>{content}</Link> : <button key={item.label} className={styles.navItem} type="button">{content}</button>; })}</nav>
        <div className={styles.sidebarFooter}><div className={styles.storeStatus}><i /><span><strong>Hotel Malabar</strong><small>Counter is online</small></span></div></div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.pageIntro}><button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Menu setup</p><h1>Categories</h1></div></div>
          <div className={styles.profileArea}><span className={styles.demoBadge}>Demo data</span><button className={styles.iconButton} aria-label="Notifications"><Bell /></button><button className={styles.profileButton} aria-label="Open profile menu"><span className={styles.avatar}><CircleUserRound /></span><span className={styles.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span><ChevronDown /></button></div>
        </header>

        <div className={styles.content}>
          <section className={styles.hero}>
            <div><p className={styles.eyebrow}>Menu organization</p><h2>Keep your menu easy to browse</h2><p className={styles.heroCopy}>Group foods into clear categories so your team can find them quickly at the counter.</p></div>
            <button className={styles.addButton} type="button" onClick={() => { setAdding(true); setNotice(""); }}><Plus aria-hidden="true" /> Add category</button>
          </section>

          {adding && <form className={styles.addPanel} onSubmit={addCategory}><div className={styles.addIcon}><Tags /></div><div className={styles.addField}><label htmlFor="category-name">New category name</label><input id="category-name" autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Desserts" /></div><div className={styles.addActions}><button type="button" className={styles.cancelButton} onClick={() => setAdding(false)}>Cancel</button><button type="submit" className={styles.saveButton}><Check /> Save category</button></div></form>}

          {notice && <div className={styles.notice} role="status"><Check aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}

          <section className={styles.categoryPanel}>
            <div className={styles.panelHeader}><div><h2>All categories <span>{categories.length}</span></h2><p>These are sample categories for your demo workspace.</p></div><div className={styles.tools}><label className={styles.search}><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search categories" /></label><div className={styles.filters} aria-label="Filter categories">{(["All", "Active", "Inactive"] as const).map((value) => <button type="button" key={value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{value}</button>)}</div></div></div>
            <div className={styles.tableHeader}><span>Category</span><span>Menu items</span><span>Status</span><span>Actions</span></div>
            <div className={styles.categoryList}>{visibleCategories.length ? visibleCategories.map((category) => <article className={styles.categoryRow} key={category.id}><div className={styles.categoryName}><span className={`${styles.categoryIcon} ${styles[category.color]}`}><CookingPot /></span><div><strong>{category.name}</strong><small>Category #{String(category.id).slice(-4).padStart(4, "0")}</small></div></div><span className={styles.itemCount}>{category.items} {category.items === 1 ? "item" : "items"}</span><span className={`${styles.status} ${category.status === "Active" ? styles.statusActive : styles.statusInactive}`}><i />{category.status}</span><div className={styles.rowActions}><button type="button" className={styles.moreButton} aria-label={`More actions for ${category.name}`}><MoreHorizontal /></button><button type="button" className={styles.deleteButton} onClick={() => setDeleteTarget(category)} aria-label={`Delete ${category.name}`}><Trash2 /></button></div></article>) : <div className={styles.emptyState}><Shapes /><strong>No categories found</strong><span>Try a different search or add a new category.</span></div>}</div>
            <footer className={styles.panelFooter}>Showing {visibleCategories.length} of {categories.length} categories</footer>
          </section>
        </div>
      </main>
      {deleteTarget && <div className={styles.dialogBackdrop} role="presentation"><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className={styles.dialogIcon}><Trash2 /></div><h2 id="delete-title">Delete {deleteTarget.name}?</h2><p>This removes the category from this demo screen. It cannot be undone.</p><div><button type="button" className={styles.cancelButton} onClick={() => setDeleteTarget(null)}>Keep category</button><button type="button" className={styles.confirmDelete} onClick={removeCategory}>Delete category</button></div></section></div>}
    </div>
  );
}
