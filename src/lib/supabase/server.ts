import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase connection settings are missing.");
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (updates) => updates.forEach(({ name, value, options }) => jar.set(name, value, options)),
    },
  });
}

export type DatabaseClient = Awaited<ReturnType<typeof supabaseServer>>;
