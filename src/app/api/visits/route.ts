import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { visitService } from "@/server/visits/visit.service";

// GET /api/visits?patientId=&status=&limit=&offset= — list/filter (any member).
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const result = await visitService.list(ctx, {
      patientId: url.searchParams.get("patientId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/visits — create a visit (write roles only).
export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = await readJson(req);
    const visit = await visitService.create(ctx, body);
    return Response.json({ data: visit }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
