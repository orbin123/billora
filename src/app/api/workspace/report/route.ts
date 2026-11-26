import { z } from "zod";
import { failed, json } from "@/lib/api-response";
import { checkDatabase, requireWorkspace } from "@/lib/workspace-server";
import { validate } from "@/lib/workspace-validation";

export async function GET(request: Request) {
  try {
    const period = validate(z.enum(["Today", "This week", "This month"]), new URL(request.url).searchParams.get("period"));
    const { client } = await requireWorkspace();
    const result = await client.rpc("billora_report", { p_period: period });
    checkDatabase(result.error);
    return json(result.data);
  } catch (error) {
    return failed(error);
  }
}
