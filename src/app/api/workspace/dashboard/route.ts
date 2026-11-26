import { failed, json } from "@/lib/api-response";
import { workspaceDashboard } from "@/lib/workspace-server";
import { billRange, validate } from "@/lib/workspace-validation";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const { start, end } = validate(billRange, { start: params.get("start"), end: params.get("end") });
    return json(await workspaceDashboard(start, end));
  } catch (error) {
    return failed(error);
  }
}
