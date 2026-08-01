import { getAuthContext } from "@/server/auth/context";
import { appointmentService } from "@/server/appointments/appointment.service";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/appointments/:id
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const appointment = await appointmentService.get(ctx, id);
    return Response.json({ data: appointment });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/appointments/:id
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const appointment = await appointmentService.update(ctx, id, body);
    return Response.json({ data: appointment });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// DELETE /api/appointments/:id — owner/admin or practitioner (own); not staff.
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const appointment = await appointmentService.remove(ctx, id);
    return Response.json({ data: appointment });
  } catch (error) {
    return toErrorResponse(error);
  }
}
