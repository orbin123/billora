import type { PostgrestError } from "@supabase/supabase-js";
import type { BusinessProfile } from "@/data/business-profile";
import type { Bill, Category, Employee, Food, Role } from "@/data/workspace";
import { ApiError } from "./api-response";
import { supabaseAuthAdmin, supabaseServer, type DatabaseClient } from "./supabase/server";
import type { DashboardSummary, WorkspaceAction, WorkspaceSnapshot } from "./workspace-commands";
import { can, productPermissions } from "./workspace-access";
import { summarizeBills } from "./bill-dates";
import { employeeAuthEmail } from "./employee-login";
import { holdDraft } from "./workspace-validation";

export function checkDatabase(error: PostgrestError | null, conflict?: string) {
  if (!error) return;
  if (error.code === "42501") throw new ApiError(403, "Your role does not allow this change.");
  if (error.code === "23505") throw new ApiError(409, conflict ?? "This record already exists.");
  if (error.code === "23503") throw new ApiError(409, conflict ?? "This record is still in use or no longer exists.");
  if (error.code === "P0001") throw new ApiError(409, error.message);
  if (["23502", "23514", "22P02"].includes(error.code)) throw new ApiError(400, "Check the form values and try again.");
  throw error;
}

export async function requireSession(client: DatabaseClient) {
  const { data, error } = await client.auth.getClaims();
  if (error && (error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500)) throw error;
  if (!data?.claims.sub) throw new ApiError(401, "Sign in to open your workspace.");
  return { client, userId: data.claims.sub };
}

type MemberRow = {
  id: string; name: string; email: string; role_id: string; active: boolean;
  workspace_id: string; auth_user_id: string | null;
};
const memberColumns = "id,name,email,role_id,active,workspace_id,auth_user_id";
type WorkspaceRow = {
  name: string; address_lines: string[]; gstin: string; phone: string; fssai_license: string;
  currency: BusinessProfile["currency"]; time_zone: BusinessProfile["timeZone"]; gst_component_bps: number; paper: 58 | 80;
};
type FoodRow = {
  id: number; name: string; category_id: number; price_paise: number; quantity: number;
  status: Food["status"]; emoji: string; tone: string; version: number; image_revision: string | null;
};
type BillRow = {
  number: number; created_at: string; business_day: string; cashier_id: string; cashier: string;
  customer_name: string; order_type: Bill["orderType"]; payment: Bill["payment"]; lines: Bill["lines"];
  subtotal_paise: number; tax_component_paise: number; round_off_paise: number; total_paise: number;
  received_paise: number | null; receipt_profile: BusinessProfile;
};
const billColumns = "number,created_at,business_day,cashier_id,cashier,customer_name,order_type,payment,lines,subtotal_paise,tax_component_paise,round_off_paise,total_paise,received_paise,receipt_profile";

function employee(member: MemberRow): Employee {
  return {
    id: member.id, name: member.name, email: member.email, roleId: member.role_id, active: member.active,
    loginPending: !member.auth_user_id,
  };
}

function profile(row: WorkspaceRow): BusinessProfile {
  return {
    name: row.name, addressLines: row.address_lines, gstin: row.gstin, phone: row.phone,
    fssaiLicense: row.fssai_license, currency: row.currency, timeZone: row.time_zone,
    gstComponentRate: row.gst_component_bps / 100,
  };
}

function bill(row: BillRow): Bill {
  const received = row.received_paise;
  return {
    id: `BILL-${String(row.number).padStart(6, "0")}`, createdAt: row.created_at, businessDay: row.business_day,
    cashierId: row.cashier_id, cashier: row.cashier, customerName: row.customer_name, orderType: row.order_type,
    business: row.receipt_profile, payment: row.payment, lines: row.lines, gstRate: row.receipt_profile.gstComponentRate,
    subtotal: row.subtotal_paise / 100, cgst: row.tax_component_paise / 100, sgst: row.tax_component_paise / 100,
    roundOff: row.round_off_paise / 100, total: row.total_paise / 100,
    received: received === null ? undefined : received / 100,
    change: received === null ? undefined : (received - row.total_paise) / 100,
  };
}

export async function requireWorkspace(client?: DatabaseClient) {
  const { userId, client: sessionClient } = await requireSession(client ?? await supabaseServer());
  const membership = await sessionClient.from("billora_members")
    .select(`${memberColumns},role:billora_roles(id,name,permissions)`)
    .eq("auth_user_id", userId).maybeSingle<MemberRow & { role: Role | null }>();
  checkDatabase(membership.error);
  if (!membership.data) throw new ApiError(403, "Your account has no workspace access. Contact your admin.");
  if (!membership.data.active) throw new ApiError(403, "Your account is inactive. Contact your workspace owner.");

  const { role, ...member } = membership.data;
  if (!role) throw new ApiError(403, "Your workspace access changed. Sign in again.");
  return { client: sessionClient, member, role };
}

type QueryPage<Row> = PromiseLike<{ data: Row[] | null; error: PostgrestError | null }>;
const pageSize = 250;

async function allRows<Row>(read: (from: number, to: number) => QueryPage<Row>) {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const result = await read(offset, offset + pageSize - 1);
    checkDatabase(result.error);
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function readBills(client: DatabaseClient, workspace: string, start?: string, end?: string) {
  const rows: BillRow[] = [];
  let before: number | undefined;
  do {
    let query = client.from("billora_bills").select(billColumns).eq("workspace_id", workspace)
      .is("deleted_at", null).order("number", { ascending: false }).limit(pageSize);
    if (start) query = query.gte("business_day", start);
    if (end) query = query.lte("business_day", end);
    if (before !== undefined) query = query.lt("number", before);
    const result = await query.returns<BillRow[]>();
    checkDatabase(result.error);
    const page = result.data ?? [];
    rows.push(...page);
    before = page.length === pageSize ? page[page.length - 1].number : undefined;
  } while (before !== undefined);
  return rows.map(bill);
}

export async function workspaceBills(start: string, end: string) {
  const { client, member, role } = await requireWorkspace();
  if (!can(role, "View bills")) throw new ApiError(403, "Your role cannot view bills.");
  return readBills(client, member.workspace_id, start, end);
}

export async function workspaceDashboard(start: string, end: string): Promise<DashboardSummary> {
  const { client, member, role } = await requireWorkspace();
  if (role.id !== "manager") throw new ApiError(403, "Only the workspace owner can open the dashboard.");
  const bills = await readBills(client, member.workspace_id, start, end);
  const { foods, employees, ...summary } = summarizeBills(bills);
  return {
    ...summary, count: bills.length, foods: [...foods], employees: [...employees],
    recentBills: bills.slice(0, 20).map(({ id, createdAt, total, business }) => ({ id, createdAt, total, currency: business.currency })),
  };
}

export async function workspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const { client, member, role } = await requireWorkspace();
  const workspace = member.workspace_id;
  const owner = role.id === "manager";
  const catalog = can(role, ...productPermissions, "Create bills");

  const [shop, employees, roles, categories, foods, held] = await Promise.all([
    client.from("billora_workspaces").select("name,address_lines,gstin,phone,fssai_license,currency,time_zone,gst_component_bps,paper")
      .eq("id", workspace).maybeSingle<WorkspaceRow>(),
    owner ? allRows<MemberRow>((from, to) => client.from("billora_members").select(memberColumns).eq("workspace_id", workspace).order("id").range(from, to).returns<MemberRow[]>()) : [],
    owner ? allRows<Role>((from, to) => client.from("billora_roles").select("id,name,permissions").eq("workspace_id", workspace).order("id").range(from, to).returns<Role[]>()) : [],
    catalog ? allRows<Category>((from, to) => client.from("billora_categories").select("id,name,status,color").eq("workspace_id", workspace).order("id").range(from, to).returns<Category[]>()) : [],
    catalog ? allRows<FoodRow>((from, to) => client.from("billora_foods")
      .select("id,name,category_id,price_paise,quantity,status,emoji,tone,version,image_revision")
      .eq("workspace_id", workspace).order("id").range(from, to).returns<FoodRow[]>()) : [],
    can(role, "Create bills") ? client.from("billora_held_bills").select("draft").eq("member_id", member.id).maybeSingle() : null,
  ]);
  checkDatabase(shop.error);
  if (!shop.data) throw new ApiError(403, "Your workspace access changed. Sign in again.");
  if (held) checkDatabase(held.error);

  return {
    account: employee(member), role, business: profile(shop.data), paper: shop.data.paper, roles,
    employees: employees.map(employee).sort((a, b) => Number(b.roleId === "manager") - Number(a.roleId === "manager") || a.name.localeCompare(b.name)),
    categories, heldBill: holdDraft.safeParse(held?.data?.draft).data ?? null,
    foods: foods.map((row) => ({
      id: row.id, name: row.name, categoryId: row.category_id, price: row.price_paise / 100, quantity: row.quantity,
      status: row.status, emoji: row.emoji, tone: row.tone, version: row.version,
      image: row.image_revision ? `/api/workspace/food-image/${row.id}?v=${row.image_revision}` : undefined,
    })),
  };
}

async function expectRow(query: PromiseLike<{ data: { id: unknown } | null; error: PostgrestError | null }>, conflict?: string) {
  const result = await query;
  checkDatabase(result.error, conflict);
  if (!result.data) throw new ApiError(409, "This record changed or is unavailable. Reload the workspace and try again.");
}

async function provisionEmployee(
  { client, member, role }: Awaited<ReturnType<typeof requireWorkspace>>,
  { employee: { id, name, username, roleId, active }, password }: Extract<WorkspaceAction, { kind: "provision-employee" }>,
) {
  if (role.id !== "manager") throw new ApiError(403, "Only the workspace owner can create employee logins.");
  const admin = supabaseAuthAdmin();
  if (!admin) throw new ApiError(503, "Employee login setup is unavailable. Contact the person who manages Billora.");

  let email = username ? employeeAuthEmail(username) : "";
  if (id) {
    const pending = await client.from("billora_members").select("email")
      .eq("workspace_id", member.workspace_id).eq("id", id).is("auth_user_id", null).maybeSingle<{ email: string }>();
    checkDatabase(pending.error);
    if (!pending.data) throw new ApiError(409, "This employee already has a login or is unavailable.");
    email = pending.data.email;
  }
  const { error: checkError } = await client.rpc("billora_check_employee_login", {
    p_member: id || null, p_email: email, p_role: roleId,
  });
  if (checkError?.code === "PGRST202") throw new ApiError(503, "Apply the employee login migration before setting passwords.");
  checkDatabase(checkError);

  const { error } = await admin.createUser({
    email, password, email_confirm: true,
    app_metadata: {
      billora_employee: {
        workspace_id: member.workspace_id, owner_id: member.id, member_id: id || null,
        name, role_id: roleId, active,
      },
    },
  });
  if (!error) return {};
  if (error.code === "email_exists" || error.code === "user_already_exists") {
    throw new ApiError(409, "This login is already in use. Choose a different username.");
  }
  if (error.code === "weak_password") throw new ApiError(400, "Choose a stronger password and try again.");
  if (error.status === 429) throw new ApiError(429, "Account creation is temporarily limited. Try again later.");
  console.warn("Billora employee login creation failed", { code: error.code, status: error.status });
  throw new ApiError(503, "Billora couldn’t create this login. Refresh Employees and check the account status before retrying.");
}

export async function mutateWorkspace(action: WorkspaceAction) {
  const context = await requireWorkspace();
  const { client, member, role } = context;
  const workspace = member.workspace_id;
  switch (action.kind) {
    case "save-category": {
      const values = { name: action.name, status: action.status };
      await expectRow((action.id
        ? client.from("billora_categories").update(values).eq("workspace_id", workspace).eq("id", action.id)
        : client.from("billora_categories").insert({ ...values, workspace_id: workspace })).select("id").maybeSingle(),
      "A category with this name already exists.");
      return {};
    }
    case "remove-category":
      await expectRow(client.from("billora_categories").delete().eq("workspace_id", workspace).eq("id", action.id).select("id").maybeSingle(),
        "Move the foods to another category before deleting this one.");
      return {};
    case "save-food": {
      const food = action.food;
      if (food.id && !food.version) throw new ApiError(400, "Reload the food before saving.");
      const values = {
        name: food.name, category_id: food.categoryId, price_paise: Math.round(food.price * 100),
        quantity: food.quantity, status: food.status, emoji: food.emoji, tone: food.tone,
        ...(food.image ? { image: food.image } : {}),
      };
      await expectRow((food.id
        ? client.from("billora_foods").update(values).eq("workspace_id", workspace).eq("id", food.id).eq("version", food.version!)
        : client.from("billora_foods").insert({ ...values, workspace_id: workspace })).select("id").maybeSingle(),
      "The selected category is unavailable.");
      return {};
    }
    case "remove-food":
      await expectRow(client.from("billora_foods").delete().eq("workspace_id", workspace).eq("id", action.id).select("id").maybeSingle());
      return {};
    case "save-employee": {
      const { id, name, roleId, active } = action.employee;
      await expectRow(client.from("billora_members").update({ name, role_id: roleId, active })
        .eq("workspace_id", workspace).eq("id", id).select("id").maybeSingle());
      return {};
    }
    case "provision-employee":
      return provisionEmployee(context, action);
    case "remove-employee": {
      await expectRow(client.from("billora_members").delete().eq("workspace_id", workspace).eq("id", action.id).select("id").maybeSingle());
      return {};
    }
    case "save-role": {
      const { id, name, permissions } = action.role;
      const values = { name, permissions };
      await expectRow((id
        ? client.from("billora_roles").update(values).eq("workspace_id", workspace).eq("id", id)
        : client.from("billora_roles").insert({ ...values, workspace_id: workspace })).select("id").maybeSingle(),
      "A role with this name already exists.");
      return {};
    }
    case "remove-role":
      await expectRow(client.from("billora_roles").delete().eq("workspace_id", workspace).eq("id", action.id).select("id").maybeSingle(),
        "Reassign the employees who use this role before deleting it.");
      return {};
    case "checkout": {
      const { key, lines, customerName, orderType, payment, received, currency, gstComponentRate } = action.checkout;
      const result = await client.rpc("billora_checkout", {
        p_key: key, p_lines: lines.map(({ id, quantity, price }) => ({ id, quantity, pricePaise: Math.round(price * 100) })),
        p_customer: customerName, p_order_type: orderType, p_payment: payment,
        p_received: received === undefined ? null : Math.round(received * 100), p_currency: currency,
        p_gst_bps: Math.round(gstComponentRate * 100),
      });
      checkDatabase(result.error);
      return { bill: bill(result.data as BillRow) };
    }
    case "edit-bill": {
      const result = await client.from("billora_bills").update({ customer_name: action.customerName, order_type: action.orderType })
        .eq("workspace_id", workspace).eq("number", Number(action.id.slice(5))).select("number").maybeSingle();
      checkDatabase(result.error);
      if (!result.data) throw new ApiError(409, "This bill changed or is unavailable.");
      return {};
    }
    case "remove-bills": {
      const { error } = await client.rpc("billora_remove_bills", {
        p_numbers: action.ids?.map((id) => Number(id.slice(5))) ?? null, p_day: action.day ?? null,
      });
      checkDatabase(error);
      return {};
    }
    case "paper":
      await expectRow(client.from("billora_workspaces").update({ paper: action.width }).eq("id", workspace).select("id").maybeSingle());
      return {};
    case "business": {
      const { name, addressLines, gstin, phone, fssaiLicense, currency, timeZone, gstComponentRate } = action.business;
      await expectRow(client.from("billora_workspaces").update({
        name, address_lines: addressLines, gstin, phone, fssai_license: fssaiLicense, currency, time_zone: timeZone,
        gst_component_bps: Math.round(gstComponentRate * 100),
      }).eq("id", workspace).select("id").maybeSingle());
      return {};
    }
    case "hold": {
      if (!can(role, "Create bills")) throw new ApiError(403, "Your role cannot hold bills.");
      const result = action.bill
        ? await client.from("billora_held_bills").upsert({ member_id: member.id, draft: action.bill })
        : await client.from("billora_held_bills").delete().eq("member_id", member.id);
      checkDatabase(result.error);
      return {};
    }
  }
}
