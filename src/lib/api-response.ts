export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function failed(error: unknown) {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  console.error("Billora request failed", error);
  return json({ error: "Billora couldn’t reach the workspace. Try again." }, 500);
}

export async function requestBody(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0] ?? new URL(request.url).protocol.replace(":", "");
  if (!host || origin !== `${protocol}://${host}`) throw new ApiError(403, "Open Billora to make this change.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "Expected a JSON request.");
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "The request could not be read.");
  }
}
