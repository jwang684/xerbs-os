import { getAuthContext } from "@/server/auth/context";
import { appointmentService } from "@/server/appointments/appointment.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/appointments/calendar?view=day|week|month&date=YYYY-MM-DD&providerId=
// Appointments in the window, grouped by day. Tenant- and role-scoped.
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const result = await appointmentService.getCalendar(ctx, {
      view: url.searchParams.get("view") ?? undefined,
      date: url.searchParams.get("date") ?? undefined,
      providerId: url.searchParams.get("providerId") ?? undefined,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
