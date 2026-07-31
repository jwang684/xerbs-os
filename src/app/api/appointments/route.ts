import { getAuthContext } from "@/server/auth/context";
import { appointmentService } from "@/server/appointments/appointment.service";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";

// GET /api/appointments?providerId=&patientId=&from=&to=&limit=&offset=
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const result = await appointmentService.list(ctx, {
      providerId: url.searchParams.get("providerId") ?? undefined,
      patientId: url.searchParams.get("patientId") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/appointments — create an appointment.
export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = await readJson(req);
    const appointment = await appointmentService.create(ctx, body);
    return Response.json({ data: appointment }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
