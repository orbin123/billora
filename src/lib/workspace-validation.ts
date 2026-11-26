import { z } from "zod";
import { currencies, timeZones } from "@/data/business-profile";
import { allPermissions, paymentMethods } from "@/data/workspace-rules";
import { ApiError } from "./api-response";

export const inviteCode = z.uuid();
export const billRange = z.object({ start: z.iso.date(), end: z.iso.date() }).refine(({ start, end }) => start <= end);
const name = (length: number) => z.string().trim().min(1).max(length);
const text = (length: number) => z.string().trim().max(length);
const int = (min: number, max: number) => z.int().min(min).max(max);
const id = int(1, 2147483647);
const billId = z.string().regex(/^BILL-[0-9]{6,15}$/);
const price = z.number().min(0.01).max(999999.99);
const quantity = int(0, 999999);
const tags = z.enum(["rice", "curry", "fish", "bread", "drink", "special"]);
const currency = z.enum(currencies);
const gstComponentRate = z.number().min(0).max(50);
const order = { customerName: text(120), orderType: z.enum(["Pick Up", "Dine In"]) };
const line = z.object({ id, price, quantity: int(1, 999999) });

export const holdDraft = z.object({
  ...order,
  lines: z.array(line.extend({ name: name(80) })).min(1).max(200),
});

const email = z.email().max(254).transform((value) => value.toLowerCase());
export const authRequest = z.union([
  z.object({ kind: z.literal("signin"), email, password: z.string().min(1).max(128), invite: inviteCode.optional() }),
  z.object({ kind: z.literal("signup"), email, password: z.string().min(8).max(128), invite: inviteCode.optional() }),
  z.object({ kind: z.literal("setup"), invite: inviteCode }),
  z.object({ kind: z.literal("setup"), name: name(60), business: name(80) }),
  z.object({ kind: z.literal("signout") }),
]);
export const workspaceAction = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("save-category"), id: id.optional(), name: name(60), status: z.enum(["Active", "Inactive"]) }),
  z.object({ kind: z.literal("remove-category"), id }),
  z.object({ kind: z.literal("save-food"), food: z.object({
    id: int(0, 2147483647), version: id.optional(), name: name(80), categoryId: id, price, quantity,
    status: z.enum(["Available", "Unavailable"]), emoji: text(16), tone: tags,
    image: z.string().max(2796250).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/).optional(),
  }) }),
  z.object({ kind: z.literal("remove-food"), id }),
  z.object({ kind: z.literal("save-employee"), employee: z.object({
    id: z.union([z.literal(""), z.uuid()]), name: name(60), email, roleId: z.union([z.literal("employee"), z.uuid()]), active: z.boolean(),
  }) }),
  z.object({ kind: z.literal("remove-employee"), id: z.uuid() }),
  z.object({ kind: z.literal("renew-invite"), id: z.uuid() }),
  z.object({ kind: z.literal("save-role"), role: z.object({
    id: z.union([z.literal(""), z.literal("employee"), z.uuid()]), name: name(60),
    permissions: z.array(z.enum(allPermissions)).max(allPermissions.length).transform((values) => [...new Set(values)]),
  }) }),
  z.object({ kind: z.literal("remove-role"), id: z.uuid() }),
  z.object({ kind: z.literal("checkout"), checkout: z.object({
    ...order, key: z.uuid(), payment: z.enum(paymentMethods), lines: z.array(line).min(1).max(200),
    received: z.number().min(0).max(9999999999.99).optional(), currency, gstComponentRate,
  }) }),
  z.object({ kind: z.literal("edit-bill"), id: billId, ...order }),
  z.object({ kind: z.literal("remove-bills"), ids: z.array(billId).min(1).max(2000).optional(), day: z.iso.date().optional() }),
  z.object({ kind: z.literal("paper"), width: z.union([z.literal(58), z.literal(80)]) }),
  z.object({ kind: z.literal("business"), business: z.object({
    name: name(80), addressLines: z.array(name(120)).max(5), gstin: text(30), phone: text(35), fssaiLicense: text(30),
    currency, timeZone: z.enum(timeZones), gstComponentRate,
  }) }),
  z.object({ kind: z.literal("hold"), bill: holdDraft.nullable() }),
]);

export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError(400, "Check the form values and try again.");
  return result.data;
}
