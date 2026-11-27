"use client";

import { useCallback, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Menu, PencilLine, ReceiptText, Search, Trash2 } from "lucide-react";
import { useListPage } from "@/lib/use-list-page";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace, useWorkspaceResource } from "@/components/workspace-provider";
import { BillDetailsDialog } from "@/components/bill-details-dialog";
import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { paymentMethods, type Bill, type PaymentMethod } from "@/data/workspace";
import { formatDay, shiftDate } from "@/lib/bill-dates";
import styles from "../categories/categories.module.css";
import billStyles from "./bills.module.css";

import { currencyFormatter } from "@/data/business-profile";

type Deletion = { scope: "day" | "selected"; bills: Bill[] };

function billCount(count: number) {
  return `${count} ${count === 1 ? "bill" : "bills"}`;
}

export default function BillsPage() {
  const { allows, billTime, businessDate, money } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState<"All" | PaymentMethod>("All");
  const [offset, setOffset] = useState(0);
  const [details, setDetails] = useState<Bill | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [notice, setNotice] = useState("");
  const day = shiftDate(businessDate.format(new Date()), offset);
  const resource = useWorkspaceResource<Bill[]>(`/api/workspace/bills?start=${day}&end=${day}`);
  const dayBills = resource.data ?? [];
  const canDelete = allows("Delete bills");
  const canEdit = allows("Edit bills");
  const [editing, setEditing] = useState<Bill | null>(null);
  const visible = dayBills.filter((bill) =>
    (payment === "All" || payment === bill.payment) &&
    `${bill.id} ${bill.cashier}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const billPage = useListPage(visible);
  const totals = new Map<Bill["business"]["currency"], number>();
  for (const bill of visible) totals.set(bill.business.currency, (totals.get(bill.business.currency) ?? 0) + Math.round(bill.total * 100));
  const totalLabel = [...totals].map(([currency, amount]) =>
    currencyFormatter(currency).format(amount / 100)).join(" · ") || money.format(0);
  const selectedBills = visible.filter((bill) => selected.has(bill.id));
  const pageSelectedCount = billPage.items.filter((bill) => selected.has(bill.id)).length;
  const allPageSelected = billPage.items.length > 0 && pageSelectedCount === billPage.items.length;

  function changeDay(amount: number) {
    setOffset((current) => Math.min(current + amount, 0));
    billPage.setPage(1);
    setSelected(new Set());
    setNotice("");
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      for (const { id } of billPage.items) {
        if (allPageSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function toggleBill(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function askToDelete(scope: Deletion["scope"]) {
    const bills = scope === "day" ? dayBills : selectedBills;
    if (!bills.length) return;
    mutation.clearError();
    setAcknowledged(false);
    setDeletion({ scope, bills });
  }

  function confirmDeletion() {
    if (!deletion || !acknowledged) return;
    void mutation.run({ kind: "remove-bills", ids: deletion.bills.map(({ id }) => id) }, () => {
      setNotice(`Deleted ${billCount(deletion.bills.length)}. Dashboard and reports updated.`);
      setSelected(new Set());
      setDeletion(null);
    });
  }

  return <div className={styles.shell}>
    <WorkspaceNavigation styles={styles} current="/bills" open={menuOpen} onClose={closeMenu} />
    <main className={styles.main}>
      <header className={styles.topbar}><div className={styles.pageIntro}>
        <button className={styles.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
        <div><p>Sales history</p><h1>Today&apos;s bills</h1></div>
      </div><WorkspaceProfile styles={styles} /></header>
      <div className={styles.content}>
        <section className={styles.billsHero}>
          <div><h2>Completed bills</h2><p className={styles.heroCopy}>Review past orders and payment details.</p></div>
          <div className={styles.dateControl}>
            <button type="button" onClick={() => changeDay(-1)} aria-label="Previous day"><ChevronLeft /></button>
            <span><CalendarDays />{offset === 0 ? "Today, " : offset === -1 ? "Yesterday, " : ""}{formatDay(day)}</span>
            <button type="button" onClick={() => changeDay(1)} aria-label="Next day" disabled={offset === 0}><ChevronRight /></button>
          </div>
        </section>
        {notice && <p className={billStyles.notice} role="status">{notice}</p>}
        <section className={`${styles.categoryPanel} ${styles.billsPanel}`}>
          <div className={styles.panelHeader}><div><h2>Bill history <span>{visible.length}</span></h2></div>
            <div className={styles.tools}>
              <label className={styles.search}><Search /><input value={query} onChange={(event) => { setQuery(event.target.value); setSelected(new Set()); billPage.setPage(1); }} placeholder="Search bill or cashier" aria-label="Search bill or cashier" /></label>
              <label className="workspace-field">Payment
                <select aria-label="Payment method" value={payment} onChange={(event) => { setPayment(event.target.value as "All" | PaymentMethod); setSelected(new Set()); billPage.setPage(1); }}>
                  <option value="All">All methods</option>{paymentMethods.map((method) => <option key={method}>{method}</option>)}
                </select>
              </label>
            </div>
          </div>
          {canDelete && dayBills.length > 0 && <div className={billStyles.manage}>
            <div className={billStyles.selection}>
              <label className={billStyles.selectVisible}>
                <input
                  type="checkbox"
                  disabled={!billPage.items.length}
                  checked={allPageSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = pageSelectedCount > 0 && !allPageSelected;
                  }}
                  onChange={togglePage}
                />
                Select bills on this page
              </label>
              <span className={billStyles.selectionCount} aria-live="polite">{selectedBills.length} selected</span>
            </div>
            <div className={billStyles.actions}>
              <Button type="button" variant="outline" className={billStyles.danger} disabled={!selectedBills.length} onClick={() => askToDelete("selected")}>Delete selected</Button>
              <Button type="button" variant="outline" className={billStyles.danger} onClick={() => askToDelete("day")}><Trash2 size={16} aria-hidden="true" /> Delete day’s bills</Button>
            </div>
          </div>}
          <div className={`${styles.tableHeader} ${styles.billsTableHeader}`}><span>Bill number</span><span>Cashier</span><span>Items</span><span>Total</span><span>Payment</span><span>Action</span></div>
          <div className={styles.categoryList}>
            {resource.error && <p role="alert" className="p-4">{resource.error}</p>}
            {!resource.data && !resource.error && <p role="status" className="p-4">Loading bills…</p>}
            {billPage.items.map((bill) => <article className={`${styles.categoryRow} ${styles.billRow} ${selected.has(bill.id) ? billStyles.selectedRow : ""}`} key={bill.id}>
              <div className={billStyles.billIdentity}>
                {canDelete && <label className={billStyles.billCheckbox}>
                  <input type="checkbox" checked={selected.has(bill.id)} onChange={() => toggleBill(bill.id)} aria-label={`Select ${bill.id}`} />
                </label>}
                <strong className={styles.billId}>{bill.id}<small>{billTime.format(new Date(bill.createdAt))}</small></strong>
              </div>
              <span className={styles.customer}>{bill.cashier}</span>
              <span className={styles.itemCount}>{bill.lines.reduce((sum, line) => sum + line.quantity, 0)} items</span>
              <strong className={styles.billTotal}>{currencyFormatter(bill.business.currency).format(bill.total)}</strong>
              <span className={`${styles.payment} ${styles[`payment${bill.payment}`] ?? styles.paymentUPI}`}><i />{bill.payment}</span>
              <div className={billStyles.billActions} data-editable={canEdit || undefined}>
                <button type="button" className={styles.viewButton} onClick={() => setDetails(bill)} aria-label={`View ${bill.id}`}><Eye aria-hidden="true" /></button>
                {canEdit && <button type="button" className={styles.moreButton} aria-label={`Edit ${bill.id}`} onClick={() => { mutation.clearError(); setEditing(bill); }}><PencilLine size={17} /></button>}
              </div>
            </article>)}
            {!visible.length && resource.data && <div className={styles.emptyState}><ReceiptText /><strong>No bills found</strong><span>Complete a bill or try a different date or filter.</span></div>}
          </div>
          <ListPagination pagination={billPage} label="bills" singular="bill" />
          {resource.data && <footer className={`${styles.billsFooter} ${billStyles.salesTotal}`}><span><strong>Filtered sales</strong><b>{totalLabel}</b></span></footer>}
        </section>
      </div>
    </main>
    {deletion && <WorkspaceDialog titleId="delete-bills-title" onClose={() => setDeletion(null)} className={billStyles.confirmDialog}>
      <div className={styles.dialogIcon}><Trash2 aria-hidden="true" /></div>
      <h2 id="delete-bills-title">{deletion.scope === "day" ? `Delete all bills for ${formatDay(day)}?` : `Delete ${billCount(deletion.bills.length)}?`}</h2>
      <p>
        {deletion.scope === "day"
          ? `This deletes ${billCount(deletion.bills.length)} on this date, including bills outside your search or payment filter.`
          : `This deletes the selected ${billCount(deletion.bills.length)} from ${formatDay(day)}.`}
      </p>
      <p>These bills will be removed from sales reports. Adjust inventory separately if needed. This cannot be undone.</p>
      {mutation.error && <p role="alert" className="text-rose-800">{mutation.error}</p>}
      <label className={billStyles.confirm}>
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
        I understand these bills will be deleted.
      </label>
      <div className={billStyles.confirmActions}>
        <Button type="button" variant="outline" onClick={() => setDeletion(null)}>Keep bills</Button>
        <Button type="button" className={billStyles.confirmDelete} disabled={!acknowledged || mutation.pending} onClick={confirmDeletion}>Delete {billCount(deletion.bills.length)}</Button>
      </div>
    </WorkspaceDialog>}
    {editing && <WorkspaceDialog titleId="edit-bill-title" onClose={() => setEditing(null)} className="w-md rounded-2xl bg-white p-5">
      <form className="grid gap-4" onSubmit={(event) => {
        event.preventDefault();
        void mutation.run({ kind: "edit-bill", id: editing.id, customerName: editing.customerName, orderType: editing.orderType },
          () => { setEditing(null); setNotice("Bill details updated."); });
      }}>
        <h2 id="edit-bill-title" className="text-lg font-extrabold">Edit {editing.id}</h2>
        <label className="workspace-field">Customer name<input maxLength={120} value={editing.customerName} onChange={(event) => setEditing({ ...editing, customerName: event.target.value })} /></label>
        <label className="workspace-field">Order type<select value={editing.orderType} onChange={(event) => setEditing({ ...editing, orderType: event.target.value === "Dine In" ? "Dine In" : "Pick Up" })}><option>Pick Up</option><option>Dine In</option></select></label>
        {mutation.error && <p role="alert" className="text-sm text-rose-800">{mutation.error}</p>}
        <footer className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={mutation.pending}>Save changes</Button></footer>
      </form>
    </WorkspaceDialog>}
    {details && <BillDetailsDialog bill={details} onClose={() => setDetails(null)} />}
  </div>;
}
