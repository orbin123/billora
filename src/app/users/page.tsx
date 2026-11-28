"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Check, Menu, PencilLine, Plus, Search, Trash2, UsersRound, X } from "lucide-react";
import { useListPage } from "@/lib/use-list-page";
import { ListPagination } from "@/components/list-pagination";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { Button } from "@/components/ui/button";
import { employeeLogin, employeeUsernameHint, employeeUsernamePattern } from "@/lib/employee-login";
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
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const visibleEmployees = employees.filter((employee) =>
    (filter === "All" || employee.active === (filter === "Active")) &&
    `${employee.name} ${employee.email} ${roles.find(({ id }) => id === employee.roleId)?.name}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const pagination = useListPage(visibleEmployees);
  const needsLogin = draft && (!draft.id || draft.loginPending);

  function edit(employee?: Employee) {
    setError("");
    mutation.clearError();
    setNotice("");
    setPassword("");
    setDraft(employee ?? { id: "", name: "", email: "", roleId: "employee", active: true });
  }

  function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const name = draft.name.trim();
    const login = draft.id ? employeeLogin(draft.email) : draft.email.trim().toLowerCase();
    if (!name) {
      setError("Enter the employee’s name.");
      return;
    }
    if (!draft.id && !employeeUsernamePattern.test(login)) {
      setError(employeeUsernameHint);
      return;
    }
    if (needsLogin && new TextEncoder().encode(password).length > 72) {
      setError("Use a shorter password.");
      return;
    }
    const employee = { name, roleId: draft.roleId, active: draft.active };
    setError("");
    void mutation.run(needsLogin
      ? { kind: "provision-employee", employee: { ...employee, ...(draft.id ? { id: draft.id } : { username: login }) }, password }
      : { kind: "save-employee", employee: { ...employee, id: draft.id } }, () => {
      setNotice(needsLogin ? `Login created for ${name}. They can sign in as ${login}.` : `${name} was updated.`);
      setDraft(null);
      setPassword("");
    });
  }

  function updateStatus(employee: Employee) {
    setNotice("");
    void mutation.run({ kind: "save-employee", employee: { ...employee, active: !employee.active } }, () => {
      setNotice(`${employee.name} was ${employee.active ? "deactivated" : "activated"}.`);
    });
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
          <div><h2>Manage your team</h2><p className={common.heroCopy}>Create employee logins, assign roles, and manage workspace access.</p></div>
          <button className={common.addButton} type="button" onClick={() => edit()}><Plus /> Add employee</button>
        </section>
        {mutation.error && !draft && !deleting && <p role="alert" className="mb-3 text-sm text-rose-800">{mutation.error}</p>}
        {notice && <div className={common.notice} role="status"><Check />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X /></button></div>}
        <section className={`${common.categoryPanel} ${styles.usersPanel}`}>
          <div className={common.panelHeader}>
            <div><h2>Team members <span>{employees.length}</span></h2></div>
            <div className={common.tools}>
              <label className={common.search}><Search /><input value={query} onChange={(event) => { setQuery(event.target.value); pagination.setPage(1); }} placeholder="Search employees" aria-label="Search employees" /></label>
              <div className={common.filters} aria-label="Filter employees">
                {(["All", "Active", "Inactive"] as const).map((value) => <button type="button" key={value} aria-pressed={value === filter} className={value === filter ? common.filterActive : ""} onClick={() => { setFilter(value); pagination.setPage(1); }}>{value}</button>)}
              </div>
            </div>
          </div>
          <div className={styles.tableHeader}><span>Employee</span><span>Role</span><span>Status</span><span>Actions</span></div>
          <div className={styles.userList}>
            {pagination.items.map((employee) => {
              const initials = employee.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
              const roleName = roles.find((role) => role.id === employee.roleId)?.name;
              const status = !employee.active ? "Inactive" : employee.loginPending ? "Login needed" : "Active";
              return <article className={styles.userRow} key={employee.id}>
                <div className={styles.userName}><span className={styles.avatar}>{initials}</span><span><strong>{employee.name}</strong><small>{employeeLogin(employee.email)}</small></span></div>
                <span className={`${styles.role} ${employee.roleId === "manager" ? styles.adminRole : ""}`} title={roleName}>{roleName}</span>
                <span className={`${common.status} ${styles.userStatus} ${employee.active ? common.statusActive : common.statusInactive}`}><i />{status}</span>
                {employee.roleId !== "manager" && <div className={styles.actions}>
                  <button className={`${styles.toggle} ${employee.active ? styles.toggleActive : ""}`} type="button" role="switch" disabled={mutation.pending} aria-checked={employee.active} aria-label={`Active account for ${employee.name}`} onClick={() => updateStatus(employee)}><i /></button>
                  <button className={common.moreButton} type="button" aria-label={`Edit ${employee.name}`} title="Edit details" onClick={() => edit(employee)}><PencilLine /></button>
                  <button className={common.deleteButton} type="button" aria-label={`Delete ${employee.name}`} title="Delete employee" onClick={() => { mutation.clearError(); setDeleting(employee); }}><Trash2 /></button>
                </div>}
              </article>;
            })}
            {!visibleEmployees.length && <div className={common.emptyState}><UsersRound /><strong>No employees found</strong><span>Try a different name or status.</span></div>}
          </div>
          <ListPagination pagination={pagination} label="employees" singular="employee" />
        </section>
      </div>
    </main>
    {draft && <WorkspaceDialog titleId="employee-form-title" onClose={() => setDraft(null)} className="w-lg rounded-2xl bg-white p-5 sm:p-6">
      <form onSubmit={submitEmployee} className="grid gap-4">
        <h2 id="employee-form-title" className="text-xl font-extrabold">{draft.id ? "Edit employee" : "Add employee"}</h2>
        <label className="workspace-field">Employee name<input required maxLength={60} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label className="workspace-field">{draft.id && employeeLogin(draft.email).includes("@") ? "Sign-in email" : "Username"}
          <input required autoComplete="off" autoCapitalize="none" spellCheck={false} readOnly={Boolean(draft.id)}
            aria-describedby={draft.id ? undefined : "employee-username-hint"} maxLength={draft.id ? 254 : 32}
            value={employeeLogin(draft.email)} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          {!draft.id && <small id="employee-username-hint">{employeeUsernameHint}</small>}
        </label>
        {needsLogin && <label className="workspace-field">Initial password
          <input required type="password" autoComplete="new-password" minLength={8} maxLength={72}
            value={password} onChange={(event) => setPassword(event.target.value)} />
          <small>Use at least 8 characters.</small>
        </label>}
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
          <Button type="submit" disabled={mutation.pending}>{needsLogin ? "Create login" : "Save changes"}</Button>
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
