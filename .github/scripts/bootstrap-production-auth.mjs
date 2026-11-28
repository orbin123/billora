// Invoked only by the protected production release when the bootstrap secret is set.
const {
  SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN,
  BILLORA_BOOTSTRAP_ADMIN_EMAIL: email, BILLORA_BOOTSTRAP_ADMIN_PASSWORD: password,
} = process.env;

if (!email || !password) throw new Error("Set the initial admin email and password in the production environment.");

async function api(url, headers, operation, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: { ...headers, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${operation} failed (HTTP ${response.status}).`);
  return response.json();
}

const management = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}`;
const supabaseHeaders = { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}` };
const authConfig = await api(`${management}/config/auth`, supabaseHeaders, "Disable Supabase sign-up", "PATCH", {
  disable_signup: true,
});
if (authConfig.disable_signup !== true) throw new Error("Supabase sign-up is still enabled.");

const keysUrl = `${management}/api-keys`;
const keyName = "billora_vercel_production";
const keys = await api(keysUrl, supabaseHeaders, "Find Billora's server key");
const existing = keys.find((key) => key.name === keyName && key.type === "secret");
const { api_key: secret } = existing
  ? await api(`${keysUrl}/${existing.id}?reveal=true`, supabaseHeaders, "Read Billora's server key")
  : await api(`${keysUrl}?reveal=true`, supabaseHeaders, "Create Billora's server key", "POST", {
    type: "secret", name: keyName, description: "Billora production employee provisioning",
  });
if (!secret?.startsWith("sb_secret_")) throw new Error("Supabase did not return the Billora server key.");
console.log(`::add-mask::${secret}`);

const vercelEnv = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_ORG_ID}`;
const vercelHeaders = { Authorization: `Bearer ${VERCEL_TOKEN}` };
const { envs } = await api(vercelEnv, vercelHeaders, "Check Vercel production environment");
if (!envs.some((env) => env.key === "SUPABASE_SECRET_KEY" && env.target.includes("production"))) {
  await api(vercelEnv.replace("/v9/", "/v10/"), vercelHeaders, "Configure Vercel employee provisioning", "POST", {
    key: "SUPABASE_SECRET_KEY", value: secret, type: "sensitive", target: ["production"],
  });
}

const usersUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/admin/users`;
const authHeaders = { apikey: secret };
const { users } = await api(usersUrl, authHeaders, "Check existing Auth users");
const existingAdmin = users.find((user) => user.app_metadata?.billora_admin === true);
if (existingAdmin && existingAdmin.email !== email) throw new Error("A different bootstrap admin already exists.");
if (!existingAdmin) {
  await api(usersUrl, authHeaders, "Create the initial admin", "POST", {
    email, password, email_confirm: true, app_metadata: { billora_admin: true },
  });
}
console.log("Production sign-up is disabled and the initial admin is configured.");
