"use client";

import { useState, type FormEvent } from "react";
import { Check, PencilLine, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { SettingsTitle } from "./settings-title";
import styles from "./settings-surface.module.css";
import { Button } from "@/components/ui/button";
import { allPermissions, permissionGroups, type Permission, type Role } from "@/data/workspace";

export function RoleSettings() {
  const { roles, employees } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [draft, setDraft] = useState<Role | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canEdit = draft?.id !== "manager";
  const editMode = canEdit && editing;
  const editName = editMode && draft?.id !== "employee";

  function openRole(role: Role, edit = false) {
    setDraft(role);
    setEditing(edit);
    setError("");
    mutation.clearError();
    setNotice("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !editMode) return;
    const name = draft.name.trim();
    if (!name || roles.some((role) => role.id !== draft.id && role.name.toLowerCase() === name.toLowerCase())) {
      setError(name ? "A role with this name already exists." : "Enter a role name.");
      return;
    }
    setError("");
    void mutation.run({ kind: "save-role", role: { ...draft, name } }, () => {
      setDraft(null);
      setNotice(`Permissions saved for ${name}.`);
    });
  }

  function toggle(permission: Permission) {
    if (!draft) return;
    const permissions = draft.permissions.includes(permission)
      ? draft.permissions.filter((value) => value !== permission)
      : [...draft.permissions, permission];
    setDraft({ ...draft, permissions });
  }

  return <section className={styles.card} id="roles-settings" aria-labelledby="roles-title">
    <div className={styles.rolesHeader}>
      <SettingsTitle id="roles-title" title="Roles & permissions" icon={ShieldCheck} />
      <Button onClick={() => openRole({ id: "", name: "", permissions: [] }, true)}><Plus size={16} /> Add role</Button>
    </div>
    {notice && <p role="status" className={styles.feedback}>{notice}</p>}
    <ul className={styles.roleList}>
      {roles.map((role) => {
        const managerRole = role.id === "manager";
        const builtIn = managerRole || role.id === "employee";
        const assigned = employees.some((employee) => employee.roleId === role.id);
        return <li key={role.id} className={styles.roleRow}>
          <div className={styles.roleName}><strong>{role.name}</strong><small>{role.permissions.length} permissions{builtIn ? " · Built-in" : assigned ? " · Assigned" : ""}</small></div>
          <div className={styles.roleActions}>
            <Button variant="outline" aria-label={`View ${role.name} role`} onClick={() => openRole(role)}>View</Button>
            {!managerRole && <Button variant="outline" aria-label={`Edit ${role.name} role`} onClick={() => openRole(role, true)}>Edit</Button>}
            {!builtIn && !assigned && <Button variant="ghost" aria-label={`Delete ${role.name} role`} onClick={() => { mutation.clearError(); setDeleting(role); }}><Trash2 size={16} /></Button>}
          </div>
        </li>;
      })}
    </ul>
    {draft && <WorkspaceDialog titleId="role-dialog-title" onClose={() => setDraft(null)} className={styles.roleDialog}>
      <form className={styles.roleForm} onSubmit={save}>
        <header className={styles.dialogHeading}>
          <h2 id="role-dialog-title">{editMode ? (draft.id === "employee" ? "Edit Employee permissions" : draft.id ? "Edit role" : "Add role") : draft.name}</h2>
          <Button type="button" variant="ghost" aria-label="Close role editor" onClick={() => setDraft(null)}><X size={19} aria-hidden="true" /></Button>
        </header>
        <div className={styles.roleBody}>
          {editName && <label className="workspace-field">Role name<input autoFocus required maxLength={60} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>}
          <div className={styles.permissionTools}>
            <span aria-live="polite">{draft.permissions.length} of {allPermissions.length} permissions selected</span>
            {editMode && <>
              <Button autoFocus={!editName} variant="outline" type="button" onClick={() => setDraft({ ...draft, permissions: allPermissions })}>Select all</Button>
              <Button variant="ghost" type="button" onClick={() => setDraft({ ...draft, permissions: [] })}>Clear all</Button>
            </>}
          </div>
          <div className={styles.permissions}>
            {Object.entries(permissionGroups).map(([group, permissions]) => (
              <fieldset key={group} className={styles.permissionGroup} disabled={!editMode}>
                <legend>{group}</legend>
                {permissions.map((permission) => {
                  const checked = draft.permissions.includes(permission);
                  return <label key={permission} className={styles.permission} data-checked={checked ? "" : undefined}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(permission)} />
                    {permission}
                  </label>;
                })}
              </fieldset>
            ))}
          </div>
          {(error || mutation.error) && <p role="alert" className="text-sm text-rose-800">{error || mutation.error}</p>}
        </div>
        <footer className={styles.roleFooter}>
          <Button type="button" variant="outline" onClick={() => setDraft(null)}>{editMode ? "Cancel" : "Close"}</Button>
          {editMode && <Button type="submit" disabled={mutation.pending}><Check size={16} aria-hidden="true" /> Save permissions</Button>}
          {canEdit && !editMode && <Button type="button" onClick={() => setEditing(true)}><PencilLine size={16} aria-hidden="true" /> Edit permissions</Button>}
        </footer>
      </form>
    </WorkspaceDialog>}
    {deleting && <WorkspaceDialog titleId="delete-role-title" onClose={() => setDeleting(null)} className="w-md rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-extrabold" id="delete-role-title">Delete {deleting.name}?</h2>
      <p className="my-3 text-sm">This removes the custom role from your workspace.</p>
      {mutation.error && <p role="alert" className="text-sm text-rose-800">{mutation.error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setDeleting(null)}>Keep role</Button>
        <Button className="bg-rose-700 hover:bg-rose-800" disabled={mutation.pending} onClick={() => mutation.run({ kind: "remove-role", id: deleting.id }, () => {
          setNotice(`${deleting.name} was deleted.`);
          setDeleting(null);
        })}>Delete role</Button>
      </div>
    </WorkspaceDialog>}
  </section>;
}
