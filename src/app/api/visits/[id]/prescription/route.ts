import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { prescriptionService } from "@/server/prescriptions/prescription.service";

// The [id] segment is the visit id.
type RouteContext = { params: Promise<{ id: string }> };

// GET /api/visits/:id/prescription — list the visit's prescriptions (newest first).
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const prescriptions = await prescriptionService.listByVisit(ctx, id);
    return Response.json({ data: prescriptions });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/visits/:id/prescription — generate a prescription from the visit's
// active diagnosis (write roles only). Immutable once created; no body required.
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const prescription = await prescriptionService.createForVisit(ctx, id);
    return Response.json({ data: prescription }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
