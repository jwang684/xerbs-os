import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { patientService } from "@/server/patients/patient.service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/patients/:id — read one patient (any member).
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const patient = await patientService.get(ctx, id);
    return Response.json({ data: patient });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/patients/:id — update a patient (write roles only).
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const patient = await patientService.update(ctx, id, body);
    return Response.json({ data: patient });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// DELETE /api/patients/:id — soft delete a patient (write roles only).
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const patient = await patientService.remove(ctx, id);
    return Response.json({ data: patient });
  } catch (error) {
    return toErrorResponse(error);
  }
}
