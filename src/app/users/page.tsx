"use client";

import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import Link from "next/link";
import { Bell, Camera, ChartNoAxesCombined, Check, ChevronDown, CircleUserRound, KeyRound, LayoutDashboard, Menu, PencilLine, Plus, ReceiptText, Search, Settings, Shapes, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import common from "../categories/categories.module.css";
import styles from "./users.module.css";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;
type User = { id: number; name: string; email: string; role: "Administrator" | "Cashier"; active: boolean; initials: string };
type ProfileDraft = Pick<User, "name" | "email" | "role">;

const navigation: Array<{ label: string; icon: Icon; href?: string }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Categories", icon: Shapes, href: "/categories" },
  { label: "Foods", icon: UtensilsCrossed, href: "/foods" },
  { label: "Billing", icon: ReceiptText, href: "/billing" },
  { label: "Today's bills", icon: ReceiptText, href: "/bills" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
  { label: "Users", icon: UsersRound, href: "/users" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const initialUsers: User[] = [
  { id: 1, name: "Ajmal", email: "ajmal@hotelmalabar.in", role: "Administrator", active: true, initials: "AJ" },
  { id: 2, name: "Rahul", email: "rahul@hotelmalabar.in", role: "Cashier", active: true, initials: "RA" },
  { id: 3, name: "Anu", email: "anu@hotelmalabar.in", role: "Cashier", active: true, initials: "AN" },
  { id: 4, name: "Nisha", email: "nisha@hotelmalabar.in", role: "Cashier", active: false, initials: "NI" },
];

export default function UsersPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>({ name: "", email: "", role: "Cashier" });
  const [notice, setNotice] = useState("");
  const visibleUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (filter === "All" || (filter === "Active") === user.active);
  }), [filter, query, users]);

  const openProfile = (user?: User) => {
    setEditingUser(user ?? null);
    setDraft(user ? { name: user.name, email: user.email, role: user.role } : { name: "", email: "", role: "Cashier" });
    setNotice("");
    setProfileOpen(true);
  };
  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) return;
    const displayName = draft.name.trim();
    const updated = { name: displayName, email: draft.email.trim(), role: draft.role, initials: displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() };
    if (editingUser) {
      setUsers((current) => current.map((user) => user.id === editingUser.id ? { ...user, ...updated } : user));
      setNotice(`${displayName}'s profile was updated`);
    } else {
      setUsers((current) => [...current, { id: Date.now(), ...updated, active: true }]);
      setNotice(`${displayName} was added`);
    }
    setProfileOpen(false);
  };
  const toggleUser = (id: number) => setUsers((current) => current.map((user) => user.id === id ? { ...user, active: !user.active } : user));

  return <div className={common.shell}>
    <button className={`${common.scrim} ${menuOpen ? common.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
    <aside className={`${common.sidebar} ${menuOpen ? common.sidebarOpen : ""}`}><div className={common.brandRow}><BrandMark className={common.brandMark} size="sidebar" /><div className={common.brandCopy}><strong>BILLORA</strong><span>All Your Billing, One Place.</span></div><button className={common.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div><nav className={common.nav} aria-label="Main navigation"><span className={common.navLabel}>Workspace</span>{navigation.map((item) => { const Icon = item.icon; return item.href ? <Link className={`${common.navItem} ${item.label === "Users" ? common.navItemActive : ""}`} key={item.label} href={item.href} aria-current={item.label === "Users" ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" /><span>{item.label}</span></Link> : <button className={common.navItem} type="button" key={item.label}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav><div className={common.sidebarFooter}><div className={common.storeStatus}><i /><span><strong>Hotel Malabar</strong><small>Counter is online</small></span></div></div></aside>
    <main className={common.main}><header className={common.topbar}><div className={common.pageIntro}><button className={common.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Workspace access</p><h1>Users</h1></div></div><div className={common.profileArea}><span className={common.demoBadge}>Demo data</span><button className={common.iconButton} aria-label="Notifications"><Bell /></button><button className={common.profileButton} aria-label="Open profile menu"><span className={common.avatar}><CircleUserRound /></span><span className={common.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span><ChevronDown /></button></div></header>
      <div className={common.content}><section className={common.hero}><div><p className={common.eyebrow}>Team management</p><h2>Give your team the right access</h2><p className={common.heroCopy}>Add the people who work at your counter and keep their workspace status clear.</p></div><button className={common.addButton} type="button" onClick={() => openProfile()}><Plus /> Add profile</button></section>
        {notice && <div className={common.notice} role="status"><Check />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}
        <section className={`${common.categoryPanel} ${styles.usersPanel}`}><div className={common.panelHeader}><div><h2>Team members <span>{users.length}</span></h2><p>These are sample users for your demo workspace.</p></div><div className={common.tools}><label className={common.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" /></label><div className={common.filters} aria-label="Filter users">{(["All", "Active", "Inactive"] as const).map((value) => <button type="button" key={value} className={filter === value ? common.filterActive : ""} onClick={() => setFilter(value)}>{value}</button>)}</div></div></div>
          <div className={styles.tableHeader}><span>User</span><span>Role</span><span>Status</span><span>Actions</span></div><div className={styles.userList}>{visibleUsers.length ? visibleUsers.map((user) => <article className={styles.userRow} key={user.id}><div className={styles.userName}><span className={styles.avatar}>{user.initials}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div><span className={`${styles.role} ${user.role === "Administrator" ? styles.adminRole : ""}`}>{user.role}</span><span className={`${common.status} ${styles.userStatus} ${user.active ? common.statusActive : common.statusInactive}`}><i />{user.active ? "Active" : "Inactive"}</span><div className={styles.actions}><button className={`${styles.toggle} ${user.active ? styles.toggleActive : ""}`} type="button" role="switch" aria-checked={user.active} aria-label={`Set ${user.name} ${user.active ? "inactive" : "active"}`} onClick={() => toggleUser(user.id)}><i /></button><button className={common.moreButton} type="button" aria-label={`Edit ${user.name}`} onClick={() => openProfile(user)}><PencilLine /></button></div></article>) : <div className={common.emptyState}><UsersRound /><strong>No users found</strong><span>Try a different search or add a team member.</span></div>}</div><footer className={common.panelFooter}>Showing {visibleUsers.length} of {users.length} team members</footer></section>
      </div></main>
    {profileOpen && <div className={styles.dialogBackdrop} role="presentation" onMouseDown={() => setProfileOpen(false)}><section className={styles.profileDialog} role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>{editingUser ? "Edit team member" : "New team member"}</p><h2 id="profile-title">{editingUser ? "Edit profile" : "Add profile"}</h2></div><button type="button" aria-label="Close profile dialog" onClick={() => setProfileOpen(false)}><X /></button></header><form onSubmit={saveProfile}><div className={styles.profileBody}><div className={styles.photoArea}><span className={styles.profileAvatar}>{draft.name ? draft.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "BP"}</span><button type="button" className={styles.changePhoto}><Camera /> Change photo</button></div><div className={styles.profileFields}><label>Name<input autoFocus value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Farah" /></label><label>Email address<input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="farah@hotelmalabar.in" /></label><label>Role<select value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as User["role"] }))}><option>Cashier</option><option>Administrator</option></select></label><button className={styles.passwordButton} type="button"><KeyRound /> Change password</button></div></div><footer><button className={common.cancelButton} type="button" onClick={() => setProfileOpen(false)}>Cancel</button><button className={common.saveButton} type="submit"><Check /> {editingUser ? "Save changes" : "Add profile"}</button></footer></form></section></div>}
  </div>;
}
