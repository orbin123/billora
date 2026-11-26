import { cookies } from "next/headers";
import { ApiError, failed, json, requestBody } from "@/lib/api-response";
import { supabaseServer, type DatabaseClient } from "@/lib/supabase/server";
import { checkDatabase, requireSession } from "@/lib/workspace-server";
import type { Permission } from "@/data/workspace";
import { workspaceHome } from "@/lib/workspace-access";
import { authRequest, validate } from "@/lib/workspace-validation";

export async function POST(request: Request) {
  try {
    const action = validate(authRequest, await requestBody(request));
    const jar = await cookies();
    if (action.kind === "setup") {
      const { client, userId } = await requireSession();
      const { error } = await client.rpc("billora_enroll", {
        p_invite: "invite" in action ? action.invite : null,
        p_name: "name" in action ? action.name : null,
        p_business: "business" in action ? action.business : null,
      });
      checkDatabase(error);
      jar.delete("billora-invitation");
      return json({ signedIn: true, next: await landingPage(client, userId) });
    }

    const client = await supabaseServer();
    if (action.kind === "signout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error && error.name !== "AuthSessionMissingError") throw error;
      jar.delete("billora-invitation");
      return json({});
    }

    const credentials = { email: action.email, password: action.password };
    const result = action.kind === "signup"
      ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: `${request.headers.get("origin")}/auth/callback` } })
      : await client.auth.signInWithPassword(credentials);
    if (result.error) {
      if (result.error.name === "AuthRetryableFetchError" || (result.error.status ?? 0) >= 500) throw result.error;
      if (result.error.code === "email_address_not_authorized") throw new ApiError(503, "Billora couldn’t send a verification email. Contact the person who manages this website.");
      if (result.error.status === 429) throw new ApiError(429, "Too many attempts. Wait a few minutes and try again.");
      if (result.error.code === "email_not_confirmed") throw new ApiError(400, "Confirm your email before signing in.");
      if (result.error.code === "weak_password") throw new ApiError(400, "Choose a stronger password and try again.");
      if (action.kind === "signin" && result.error.code === "invalid_credentials") throw new ApiError(401, "Check your email and password.");
      throw new ApiError(400, action.kind === "signup" ? "Couldn’t create the account. Check the email address and try again." : "Couldn’t sign in. Try again.");
    }

    if (action.invite) {
      jar.set("billora-invitation", action.invite, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800,
      });
    } else {
      jar.delete("billora-invitation");
    }
    const signedIn = Boolean(result.data.session);
    if (!signedIn) return json({ signedIn });
    if (action.invite) return json({ signedIn, next: `/setup?invite=${action.invite}` });
    return json({ signedIn, next: await landingPage(client, result.data.user?.id ?? "") });
  } catch (error) {
    return failed(error);
  }
}

async function landingPage(client: DatabaseClient, userId: string) {
  const membership = await client.from("billora_members").select("role_id, billora_roles(permissions)")
    .eq("auth_user_id", userId).maybeSingle<{ role_id: string; billora_roles: { permissions: Permission[] } | null }>();
  checkDatabase(membership.error);
  if (!membership.data) return "/setup";
  return workspaceHome({
    id: membership.data.role_id, name: "", permissions: membership.data.billora_roles?.permissions ?? [],
  }) ?? "/dashboard";
}
