import { getAuthContext } from "@/server/auth/context";
import { appointmentService } from "@/server/appointments/appointment.service";
import { toErrorResponse } from "@/server/http/errors";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/appointments/:id/check-in — check in a scheduled appointment and
// create its linked visit (owner/admin/staff, or the assigned practitioner).
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const result = await appointmentService.checkIn(ctx, id);
    return Response.json({ data: result }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
