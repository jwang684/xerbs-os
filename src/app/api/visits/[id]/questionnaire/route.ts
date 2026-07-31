import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { questionnaireService } from "@/server/questionnaires/questionnaire.service";

// The [id] segment is the visit id; a visit has at most one questionnaire.
type RouteContext = { params: Promise<{ id: string }> };

// GET /api/visits/:id/questionnaire — read the visit's questionnaire.
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const questionnaire = await questionnaireService.getByVisit(ctx, id);
    return Response.json({ data: questionnaire });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/visits/:id/questionnaire — create it (write roles; 409 if exists).
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const questionnaire = await questionnaireService.createForVisit(
      ctx,
      id,
      body,
    );
    return Response.json({ data: questionnaire }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/visits/:id/questionnaire — update it (write roles only).
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const questionnaire = await questionnaireService.updateForVisit(
      ctx,
      id,
      body,
    );
    return Response.json({ data: questionnaire });
  } catch (error) {
    return toErrorResponse(error);
  }
}
