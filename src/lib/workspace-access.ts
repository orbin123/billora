import type { Permission, Role } from "@/data/workspace";
import { reportPermissions } from "@/data/workspace-rules";

export const productPermissions: Permission[] = ["View products", "Add products", "Edit products", "Delete products"];

export function can(role: Role, ...permissions: Permission[]) {
  return role.id === "manager" || permissions.some((permission) => role.permissions.includes(permission));
}

export function hasWorkspaceAccess(role: Role, path: string) {
  const section = path.split("/")[1];
  if (section === "foods") return path === "/foods/new" ? can(role, "Add products") : can(role, ...productPermissions);
  if (section === "billing") return can(role, "Create bills");
  if (section === "bills") return can(role, "View bills");
  if (section === "reports") return can(role, ...Object.values(reportPermissions));
  return role.id === "manager";
}

export function workspaceHome(role: Role) {
  return ["/dashboard", "/billing", "/bills", "/foods", "/reports"].find((path) => hasWorkspaceAccess(role, path));
}
