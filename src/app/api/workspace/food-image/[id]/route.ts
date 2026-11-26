import { z } from "zod";
import { ApiError, failed } from "@/lib/api-response";
import { checkDatabase, requireWorkspace } from "@/lib/workspace-server";
import { validate } from "@/lib/workspace-validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = validate(z.coerce.number().int().min(1).max(2147483647), (await params).id);
    const revision = validate(z.uuid(), new URL(request.url).searchParams.get("v"));
    const { client, member } = await requireWorkspace();
    const result = await client.from("billora_foods").select("image").eq("workspace_id", member.workspace_id)
      .eq("id", id).eq("image_revision", revision).maybeSingle<{ image: string | null }>();
    checkDatabase(result.error);
    const image = result.data?.image?.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!image) throw new ApiError(404, "This image is unavailable.");
    return new Response(Buffer.from(image[2], "base64"), {
      headers: { "Content-Type": image[1], "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    return failed(error);
  }
}
