import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { providerService } from "@/server/providers/provider.service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/providers/:id — read a provider profile (any member).
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const provider = await providerService.get(ctx, id);
    return Response.json({ data: provider });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/providers/:id — update (owner/admin any; practitioner own only).
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const provider = await providerService.update(ctx, id, body);
    return Response.json({ data: provider });
  } catch (error) {
    return toErrorResponse(error);
  }
}
