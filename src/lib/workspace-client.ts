export class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const result = await response.json().catch(() => null);
  if (!response.ok || result === null) {
    throw new RequestError(response.status, result?.error ?? "Billora couldn’t complete the request. Try again.");
  }
  return result as T;
}

export function post<T>(url: string, body: unknown) {
  return api<T>(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export async function signOut() {
  await post("/api/auth", { kind: "signout" });
  window.location.replace("/signin");
}
