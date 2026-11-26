import { failed, json, requestBody } from "@/lib/api-response";
import { mutateWorkspace, workspaceSnapshot } from "@/lib/workspace-server";
import { validate, workspaceAction } from "@/lib/workspace-validation";

export async function GET() {
  try {
    return json(await workspaceSnapshot());
  } catch (error) {
    return failed(error);
  }
}

export async function POST(request: Request) {
  try {
    return json(await mutateWorkspace(validate(workspaceAction, await requestBody(request))));
  } catch (error) {
    return failed(error);
  }
}
