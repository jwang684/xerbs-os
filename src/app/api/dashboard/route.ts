import { getAuthContext } from "@/server/auth/context";
import { dashboardService } from "@/server/dashboard/dashboard.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/dashboard?providerId=&date= — aggregated clinical dashboard.
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const result = await dashboardService.getDashboard(ctx, {
      providerId: url.searchParams.get("providerId") ?? undefined,
      date: url.searchParams.get("date") ?? undefined,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
