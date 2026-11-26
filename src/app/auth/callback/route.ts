import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { inviteCode } from "@/lib/workspace-validation";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const client = await supabaseServer();
  const result = code ? await client.auth.exchangeCodeForSession(code) : null;
  const jar = await cookies();
  const invite = inviteCode.safeParse(jar.get("billora-invitation")?.value).data;
  const signedIn = result && !result.error;
  const location = signedIn
    ? invite ? `/setup?invite=${invite}` : "/dashboard"
    : `/signin?confirmed=manual${invite ? `&invite=${invite}` : ""}`;

  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
