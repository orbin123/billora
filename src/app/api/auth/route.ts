import { ApiError, failed, json, requestBody } from "@/lib/api-response";
import { employeeAuthEmail } from "@/lib/employee-login";
import { supabaseServer } from "@/lib/supabase/server";
import { checkDatabase, requireWorkspace } from "@/lib/workspace-server";
import { workspaceHome } from "@/lib/workspace-access";
import { authRequest, validate } from "@/lib/workspace-validation";

export async function POST(request: Request) {
  try {
    const action = validate(authRequest, await requestBody(request));
    const client = await supabaseServer();
    if (action.kind === "signout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error && error.name !== "AuthSessionMissingError") throw error;
      return json({});
    }

    const adminMode = action.mode === "admin";
    const email = action.login.includes("@") ? action.login : employeeAuthEmail(action.login);
    const { data, error } = await client.auth.signInWithPassword({ email, password: action.password });
    if (error) {
      if (error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500) throw error;
      if (error.status === 429) throw new ApiError(429, "Too many attempts. Wait a few minutes and try again.");
      if (error.code === "email_not_confirmed") throw new ApiError(400, "Your account is awaiting email confirmation.");
      throw new ApiError(401, adminMode ? "Check your admin email and password." : "Check your employee username and password.");
    }

    try {
      if (adminMode && data.user.app_metadata.billora_admin === true) {
        const { error } = await client.rpc("billora_enroll", {
          p_name: "Admin", p_business: "Grand Foods Calicut", p_invite: null,
        });
        checkDatabase(error);
      }
      const { role } = await requireWorkspace(client);
      if ((role.id === "manager") !== adminMode) {
        throw new ApiError(403, adminMode ? "Use Employee sign-in for this account." : "Use Admin sign-in for this account.");
      }
      return json({ next: workspaceHome(role) ?? "/dashboard" });
    } catch (error) {
      await client.auth.signOut({ scope: "local" });
      throw error;
    }
  } catch (error) {
    return failed(error);
  }
}
