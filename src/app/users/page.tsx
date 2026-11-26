"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Check, Copy, Menu, RefreshCw, PencilLine, Plus, Search, Trash2, UsersRound, X } from "lucide-react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/data/workspace";
import common from "../categories/categories.module.css";
import styles from "./users.module.css";

export default function UsersPage() {
  const { employees, roles } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const visibleEmployees = employees.filter((employee) =>
    (filter === "All" || employee.active === (filter === "Active")) &&
    `${employee.name} ${employee.email} ${roles.find(({ id }) => id === employee.roleId)?.name}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function edit(employee?: Employee) {
    setError("");
    mutation.clearError();
    setNotice("");
    setDraft(employee ?? { id: "", name: "", email: "", roleId: "employee", active: true });
  }

  function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    if (!name || !email) {
      setError("Enter a name and email for the employee.");
      return;
    }
    if (employees.some((employee) => employee.id !== draft.id && employee.email.toLowerCase() === email.toLowerCase())) {
      setError("This email is already in use.");
      return;
    }
    const employee = { id: draft.id, name, email, roleId: draft.roleId, active: draft.active };
    setError("");
    void mutation.run({ kind: "save-employee", employee }, () => {
      setNotice(draft.id ? `${name} was updated.` : `Invitation created for ${name}. Copy the invite link and share it with them.`);
      setDraft(null);
    });
  }

  function updateStatus(employee: Employee) {
    setNotice("");
    void mutation.run({ kind: "save-employee", employee: { ...employee, active: !employee.active } }, () => {
      setNotice(`${employee.name} was ${employee.active ? "deactivated" : "activated"}.`);
    });
  }

  async function copyInvite(employee: Employee) {
    const url = new URL("/signin", window.location.origin);
    url.searchParams.set("invite", employee.inviteCode ?? "");
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice(`Invite link copied for ${employee.name}. It expires after seven days.`);
    } catch {
      setNotice(`Copy this invite link for ${employee.name}: ${url.href}`);
    }
  }

  return <div className={common.shell}>
    <WorkspaceNavigation styles={common} current="/users" open={menuOpen} onClose={closeMenu} />
    <main className={common.main}>
      <header className={common.topbar}>
        <div className={common.pageIntro}>
          <button className={common.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div><p>Team management</p><h1>Employees</h1></div>
        </div>
        <WorkspaceProfile styles={common} />
      </header>
      <div className={common.content}>
        <section className={common.hero}>
          <div><h2>Manage your team</h2><p className={common.heroCopy}>Invite employees, assign roles, and manage workspace access.</p></div>
          <button className={common.addButton} type="button" onClick={() => edit()}><Plus /> Add employee</button>
        </section>
        {mutation.error && !draft && !deleting && <p role="alert" className="mb-3 text-sm text-rose-800">{mutation.error}</p>}
        {notice && <div className={common.notice} role="status"><Check />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}
        <section className={`${common.categoryPanel} ${styles.usersPanel}`}>
          <div className={common.panelHeader}>
            <div><h2>Team members <span>{employees.length}</span></h2></div>
            <div className={common.tools}>
              <label className={common.search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees" aria-label="Search employees" /></label>
              <div className={common.filters} aria-label="Filter employees">
                {(["All", "Active", "Inactive"] as const).map((value) => <button type="button" key={value} aria-pressed={value === filter} className={value === filter ? common.filterActive : ""} onClick={() => setFilter(value)}>{value}</button>)}
              </div>
            </div>
          </div>
          <div className={styles.tableHeader}><span>Employee</span><span>Role</span><span>Status</span><span>Actions</span></div>
          <div className={styles.userList}>
            {visibleEmployees.map((employee) => {
              const initials = employee.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
              const roleName = roles.find((role) => role.id === employee.roleId)?.name;
              const pendingInvite = Boolean(employee.inviteCode);
              const expired = Boolean(employee.inviteExpiresAt && new Date(employee.inviteExpiresAt) <= new Date());
              const status = !employee.active ? "Inactive" : expired ? "Invite expired" : pendingInvite ? "Invited" : "Active";
              return <article className={styles.userRow} key={employee.id}>
                <div className={styles.userName}><span className={styles.avatar}>{initials}</span><span><strong>{employee.name}</strong><small>{employee.email}</small></span></div>
                <span className={`${styles.role} ${employee.roleId === "manager" ? styles.adminRole : ""}`} title={roleName}>{roleName}</span>
                <span className={`${common.status} ${styles.userStatus} ${employee.active ? common.statusActive : common.statusInactive}`}><i />{status}</span>
                {employee.roleId !== "manager" && <div className={styles.actions}>
                  <button className={`${styles.toggle} ${employee.active ? styles.toggleActive : ""}`} type="button" role="switch" disabled={mutation.pending} aria-checked={employee.active} aria-label={`Active account for ${employee.name}`} onClick={() => updateStatus(employee)}><i /></button>
                  {pendingInvite && employee.active && !expired && <button className={common.moreButton} type="button" aria-label={`Copy invite link for ${employee.name}`} title="Copy invite link" onClick={() => void copyInvite(employee)}><Copy /></button>}
                  {pendingInvite && expired && <button className={common.moreButton} type="button" disabled={mutation.pending} aria-label={`Renew invite for ${employee.name}`} title="Renew invite" onClick={() => mutation.run({ kind: "renew-invite", id: employee.id }, () => setNotice("Invitation renewed. Copy the new invite link."))}><RefreshCw /></button>}
                  <button className={common.moreButton} type="button" aria-label={`Edit ${employee.name}`} title="Edit details" onClick={() => edit(employee)}><PencilLine /></button>
                  <button className={common.deleteButton} type="button" aria-label={`Delete ${employee.name}`} title="Delete employee" onClick={() => { mutation.clearError(); setDeleting(employee); }}><Trash2 /></button>
                </div>}
              </article>;
            })}
            {!visibleEmployees.length && <div className={common.emptyState}><UsersRound /><strong>No employees found</strong><span>Try a different name or status.</span></div>}
          </div>
        </section>
      </div>
    </main>
    {draft && <WorkspaceDialog titleId="employee-form-title" onClose={() => setDraft(null)} className="w-lg rounded-2xl bg-white p-5 sm:p-6">
      <form onSubmit={submitEmployee} className="grid gap-4">
        <h2 id="employee-form-title" className="text-xl font-extrabold">{draft.id ? "Edit employee" : "Add employee"}</h2>
        <label className="workspace-field">Employee name<input required maxLength={60} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label className="workspace-field">Email<input required type="email" maxLength={254} autoComplete="off" readOnly={Boolean(draft.id)} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
        <label className="workspace-field">Role
          <select value={draft.roleId} onChange={(event) => setDraft({ ...draft, roleId: event.target.value })}>
            {roles.filter(({ id }) => id !== "manager").map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </label>
        <label className="workspace-field">Account status
          <select value={String(draft.active)} onChange={(event) => setDraft({ ...draft, active: event.target.value === "true" })}>
            <option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </label>
        {(error || mutation.error) && <p role="alert" className="text-sm text-rose-800">{error || mutation.error}</p>}
        <footer className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
          <Button type="submit" disabled={mutation.pending}>{draft.id ? "Save changes" : "Create invite link"}</Button>
        </footer>
      </form>
    </WorkspaceDialog>}
    {deleting && <WorkspaceDialog titleId="delete-employee-title" onClose={() => setDeleting(null)} className="w-md rounded-2xl bg-white p-5">
      <h2 id="delete-employee-title" className="text-lg font-extrabold">Delete {deleting.name}?</h2>
      <p className="my-3 text-sm">This removes the employee from your team. Completed bills keep their cashier details.</p>
      {mutation.error && <p role="alert" className="text-sm text-rose-800">{mutation.error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setDeleting(null)}>Keep employee</Button>
        <Button className="bg-rose-700 hover:bg-rose-800" disabled={mutation.pending} onClick={() => mutation.run({ kind: "remove-employee", id: deleting.id }, () => {
          setNotice(`${deleting.name} was deleted.`);
          setDeleting(null);
        })}>Delete employee</Button>
      </div>
    </WorkspaceDialog>}
  </div>;
}
