import { getAuthContext } from "@/server/auth/context";
import { diagnosisService } from "@/server/diagnoses/diagnosis.service";
import { toErrorResponse } from "@/server/http/errors";

// The [id] segment is the visit id.
type RouteContext = { params: Promise<{ id: string }> };

// GET /api/visits/:id/diagnosis — list the visit's diagnoses (newest first).
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const diagnoses = await diagnosisService.listByVisit(ctx, id);
    return Response.json({ data: diagnoses });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/visits/:id/diagnosis — generate a diagnosis from the questionnaire
// (write roles only). Immutable once created; no body required.
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const diagnosis = await diagnosisService.createForVisit(ctx, id);
    return Response.json({ data: diagnosis }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
