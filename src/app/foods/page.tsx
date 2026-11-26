"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Check, Menu, PencilLine, Plus, Search, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { Button } from "@/components/ui/button";
import type { Food } from "@/data/workspace";
import { FoodForm } from "./new/food-form";
import formStyles from "./new/new-food.module.css";
import styles from "../categories/categories.module.css";

export default function FoodsPage() {
  const { foods, perform, categories, allows, money } = useWorkspace();
  const deletion = useWorkspaceMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | Food["status"]>("All");
  const [editing, setEditing] = useState<Food | null>(null);
  const [deleting, setDeleting] = useState<Food | null>(null);
  const [notice, setNotice] = useState("");
  const visible = foods.filter((food) => (filter === "All" || food.status === filter) && food.name.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className={styles.shell}>
    <WorkspaceNavigation styles={styles} current="/foods" open={menuOpen} onClose={closeMenu} />
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.pageIntro}>
        <button className={styles.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
        <div><p>Menu setup</p><h1>Foods</h1></div>
      </div><WorkspaceProfile styles={styles} /></header>
      <div className={styles.content}>
        <section className={styles.hero}>
          <div><h2>Manage your menu</h2><p className={styles.heroCopy}>Update what’s available at the counter.</p></div>
          {allows("Add products") && <Link className={styles.addButton} href="/foods/new"><Plus /> Add food</Link>}
        </section>
        {notice && <div className={styles.notice} role="status"><Check />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}
        <section className={`${styles.categoryPanel} ${styles.foodPanel}`}>
          <div className={styles.panelHeader}>
            <div><h2>All foods <span>{foods.length}</span></h2></div>
            <div className={styles.tools}>
              <label className={styles.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods" aria-label="Search foods" /></label>
              <div className={styles.filters}>{(["All", "Available", "Unavailable"] as const).map((value) =>
                <button type="button" key={value} aria-pressed={filter === value} className={filter === value ? styles.filterActive : ""} onClick={() => setFilter(value)}>{value}</button>,
              )}</div>
            </div>
          </div>
          <div className={`${styles.tableHeader} ${styles.foodTableHeader}`}><span>Food</span><span>Category</span><span>Price</span><span>Status</span><span>Actions</span></div>
          <div className={styles.categoryList}>
            {visible.map((food) => <article className={`${styles.categoryRow} ${styles.foodRow}`} key={food.id}>
              <div className={styles.categoryName}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Local file preview. */}
                <span className={`${styles.foodThumb} ${styles[food.tone] ?? ""}`}>{food.image ? <img src={food.image} alt="" /> : food.emoji}</span>
                <div><strong>{food.name}</strong><small>{food.quantity} in stock</small></div>
              </div>
              <span className={styles.categoryText}>{categories.find(({ id }) => id === food.categoryId)?.name}</span>
              <strong className={styles.foodPrice}>{money.format(food.price)}</strong>
              <span className={`${styles.status} ${food.status === "Available" ? styles.statusActive : styles.statusInactive}`}><i />{food.status}</span>
              <div className={styles.rowActions}>
              {allows("Edit products") && <button type="button" className={styles.moreButton} aria-label={`Edit ${food.name}`} onClick={() => setEditing(food)}><PencilLine /></button>}
              {allows("Delete products") && <button type="button" className={styles.deleteButton} aria-label={`Delete ${food.name}`} onClick={() => { deletion.clearError(); setDeleting(food); }}><Trash2 /></button>}
              </div>
            </article>)}
            {!visible.length && <div className={styles.emptyState}><UtensilsCrossed /><strong>No foods found</strong><span>Try a different search or add a food item.</span></div>}
          </div>
          <footer className={styles.panelFooter}>Showing {visible.length} of {foods.length} foods</footer>
        </section>
      </div>
    </main>
    {editing && <WorkspaceDialog titleId="edit-food-title" onClose={() => setEditing(null)} className={`${formStyles.foodDialog} w-2xl rounded-2xl bg-white p-5 sm:p-6`}>
      <h2 id="edit-food-title" className="mb-4 text-xl font-extrabold">Edit {editing.name}</h2>
      <FoodForm food={editing} cancel={<Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>} onSave={async (food) => {
        await perform({ kind: "save-food", food });
        setNotice(`${food.name} was updated.`);
        setEditing(null);
      }} />
    </WorkspaceDialog>}
    {deleting && <WorkspaceDialog titleId="delete-food-title" onClose={() => setDeleting(null)} className={`${styles.dialog} workspace-dialog`}>
      <div className={styles.dialogIcon}><Trash2 /></div><h2 id="delete-food-title">Delete {deleting.name}?</h2>
      <p>This removes the food from your menu. Completed bills keep their item details.</p>
      {deletion.error && <p role="alert" className="text-rose-800">{deletion.error}</p>}
      <div>
        <button className={styles.cancelButton} type="button" onClick={() => setDeleting(null)}>Keep food</button>
        <button className={styles.confirmDelete} type="button" disabled={deletion.pending} onClick={() => deletion.run({ kind: "remove-food", id: deleting.id }, () => {
          setNotice(`${deleting.name} was deleted.`);
          setDeleting(null);
        })}>Delete food</button>
      </div>
    </WorkspaceDialog>}
  </div>;
}
