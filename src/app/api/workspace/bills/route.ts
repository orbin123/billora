import { failed, json } from "@/lib/api-response";
import { workspaceBills } from "@/lib/workspace-server";
import { billRange, validate } from "@/lib/workspace-validation";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const { start, end } = validate(billRange, { start: params.get("start"), end: params.get("end") });
    return json(await workspaceBills(start, end));
  } catch (error) {
    return failed(error);
  }
}
