import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { visitService } from "@/server/visits/visit.service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/visits/:id — read one visit (any member).
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const visit = await visitService.get(ctx, id);
    return Response.json({ data: visit });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/visits/:id — update a visit (write roles only).
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const visit = await visitService.update(ctx, id, body);
    return Response.json({ data: visit });
  } catch (error) {
    return toErrorResponse(error);
  }
}
