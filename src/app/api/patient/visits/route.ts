import { getPatientContext } from "@/server/patient/patient-context";
import { patientPortalService } from "@/server/patient/patient-portal.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/patient/visits — the active record's visits (list only).
export async function GET(req: Request) {
  try {
    const ctx = await getPatientContext(req);
    const patientId =
      new URL(req.url).searchParams.get("patientId") ?? undefined;
    const result = await patientPortalService.listVisits(ctx, patientId);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
