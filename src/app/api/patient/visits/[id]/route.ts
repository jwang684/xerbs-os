import { getPatientContext } from "@/server/patient/patient-context";
import { patientPortalService } from "@/server/patient/patient-portal.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/patient/visits/:id — visit detail (SOAP, diagnoses, prescriptions).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getPatientContext(req);
    const { id } = await params;
    const patientId =
      new URL(req.url).searchParams.get("patientId") ?? undefined;
    const data = await patientPortalService.getVisitDetail(ctx, patientId, id);
    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
