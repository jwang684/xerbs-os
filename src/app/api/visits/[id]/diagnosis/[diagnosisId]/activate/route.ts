import { getAuthContext } from "@/server/auth/context";
import { diagnosisService } from "@/server/diagnoses/diagnosis.service";
import { toErrorResponse } from "@/server/http/errors";

type RouteContext = {
  params: Promise<{ id: string; diagnosisId: string }>;
};

// POST /api/visits/:id/diagnosis/:diagnosisId/activate — make a historical
// diagnosis the active one for the visit (write roles only).
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id, diagnosisId } = await params;
    const diagnosis = await diagnosisService.activate(ctx, id, diagnosisId);
    return Response.json({ data: diagnosis });
  } catch (error) {
    return toErrorResponse(error);
  }
}
