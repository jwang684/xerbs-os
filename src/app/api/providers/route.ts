import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { providerService } from "@/server/providers/provider.service";

// GET /api/providers?isActive=&limit=&offset= — list providers (any member).
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const result = await providerService.list(ctx, {
      isActive: url.searchParams.get("isActive") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/providers — create a provider profile (owner/admin only).
export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = await readJson(req);
    const provider = await providerService.create(ctx, body);
    return Response.json({ data: provider }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
