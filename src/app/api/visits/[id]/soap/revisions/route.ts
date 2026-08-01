import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { soapService } from "@/server/soap/soap.service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/visits/:id/soap/revisions — immutable edit history (newest first).
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const result = await soapService.listRevisions(ctx, id);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
