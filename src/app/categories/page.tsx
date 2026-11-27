"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Check, CookingPot, Menu, PencilLine, Plus, Search, Shapes, Tags, Trash2, X } from "lucide-react";
import { useListPage } from "@/lib/use-list-page";
import { ListPagination } from "@/components/list-pagination";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import type { Category } from "@/data/workspace";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import styles from "./categories.module.css";


export default function CategoriesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { categories, foods } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [status, setStatus] = useState<Category["status"]>("Active");
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const visibleCategories = useMemo(() => categories.filter((category) => {
    const matchesQuery = category.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "All" || category.status === filter;
    return matchesQuery && matchesFilter;
  }), [categories, filter, query]);
  const pagination = useListPage(visibleCategories);

  const addCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || categories.some((category) => category.id !== editing?.id && category.name.toLowerCase() === name.toLowerCase())) {
      setError(name ? "A category with this name already exists." : "Enter a category name.");
      return;
    }
    setError("");
    void mutation.run({ kind: "save-category", id: editing?.id, name, status }, () => {
      setNewName("");
      setAdding(false);
      setNotice(`${name} was ${editing ? "updated" : "added"}`);
      setEditing(null);
    });
  };

  const removeCategory = () => {
    if (!deleteTarget || foods.some(({ categoryId }) => categoryId === deleteTarget.id)) return;
    void mutation.run({ kind: "remove-category", id: deleteTarget.id }, () => {
      setNotice(`${deleteTarget.name} was deleted`);
      setDeleteTarget(null);
    });
  };

  return (
    <div className={styles.shell}>
      <WorkspaceNavigation styles={styles} current="/categories" open={menuOpen} onClose={closeMenu} />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.pageIntro}><button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Menu setup</p><h1>Categories</h1></div></div>
          <WorkspaceProfile styles={styles} /></header>

        <div className={styles.content}>
          <section className={styles.hero}>
            <div><p className={styles.eyebrow}>Menu organization</p><h2>Keep your menu easy to browse</h2><p className={styles.heroCopy}>Group foods into clear categories so your team can find them quickly at the counter.</p></div>
            <button className={styles.addButton} type="button" onClick={() => { setAdding(true); setEditing(null); setNewName(""); setStatus("Active"); setNotice(""); setError(""); mutation.clearError(); }}><Plus aria-hidden="true" /> Add category</button>
          </section>

          {adding && <form className={styles.addPanel} onSubmit={addCategory}><div className={styles.addIcon}><Tags /></div><div className={styles.addField}><label htmlFor="category-name">Category name</label><input id="category-name" autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Desserts" required maxLength={60} /><label htmlFor="category-status">Status</label><select id="category-status" className="rounded-lg border border-[#dce5e0] bg-white p-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as Category["status"])}><option>Active</option><option>Inactive</option></select>{(error || mutation.error) && <small role="alert" className="text-rose-800">{error || mutation.error}</small>}</div><div className={styles.addActions}><button type="button" className={styles.cancelButton} onClick={() => setAdding(false)}>Cancel</button><button type="submit" disabled={mutation.pending} className={styles.saveButton}><Check /> Save category</button></div></form>}

          {notice && <div className={styles.notice} role="status"><Check aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}

          <section className={styles.categoryPanel}>
            <div className={styles.panelHeader}><div><h2>All categories <span>{categories.length}</span></h2></div><div className={styles.tools}><label className={styles.search}><Search aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} placeholder="Search categories" aria-label="Search categories" /></label><div className={styles.filters} aria-label="Filter categories">{(["All", "Active", "Inactive"] as const).map((value) => <button type="button" key={value} aria-pressed={filter === value} className={filter === value ? styles.filterActive : ""} onClick={() => { setFilter(value); pagination.setPage(1); }}>{value}</button>)}</div></div></div>
            <div className={styles.tableHeader}><span>Category</span><span>Menu items</span><span>Status</span><span>Actions</span></div>
            <div className={styles.categoryList}>{visibleCategories.length ? pagination.items.map((category) => { const itemCount = foods.filter(({ categoryId }) => categoryId === category.id).length; return <article className={styles.categoryRow} key={category.id}><div className={styles.categoryName}><span className={`${styles.categoryIcon} ${styles[category.color]}`}><CookingPot /></span><div><strong>{category.name}</strong><small>Category #{String(category.id).slice(-4).padStart(4, "0")}</small></div></div><span className={styles.itemCount}>{itemCount} {itemCount === 1 ? "item" : "items"}</span><span className={`${styles.status} ${category.status === "Active" ? styles.statusActive : styles.statusInactive}`}><i />{category.status}</span><div className={styles.rowActions}><button type="button" className={styles.moreButton} aria-label={`Edit ${category.name}`} onClick={() => { setEditing(category); setNewName(category.name); setStatus(category.status); setAdding(true); setError(""); setNotice(""); mutation.clearError(); }}><PencilLine /></button><button type="button" className={styles.deleteButton} onClick={() => { mutation.clearError(); setDeleteTarget(category); }} aria-label={`Delete ${category.name}`}><Trash2 /></button></div></article>; }) : <div className={styles.emptyState}><Shapes /><strong>No categories found</strong><span>Try a different search or add a new category.</span></div>}</div>
            <ListPagination pagination={pagination} label="categories" singular="category" />
          </section>
        </div>
      </main>
      {deleteTarget && <WorkspaceDialog className={styles.dialog} titleId="delete-title" onClose={() => setDeleteTarget(null)}><div className={styles.dialogIcon}><Trash2 /></div><h2 id="delete-title">Delete {deleteTarget.name}?</h2><p>{foods.some(({ categoryId }) => categoryId === deleteTarget.id) ? "Move its foods to another category before deleting it." : "This removes the category from your menu."}</p>{mutation.error && <p role="alert" className="text-rose-800">{mutation.error}</p>}<div><button type="button" className={styles.cancelButton} onClick={() => setDeleteTarget(null)}>Keep category</button>{!foods.some(({ categoryId }) => categoryId === deleteTarget.id) && <button type="button" className={styles.confirmDelete} disabled={mutation.pending} onClick={removeCategory}>Delete category</button>}</div></WorkspaceDialog>}
    </div>
  );
}
