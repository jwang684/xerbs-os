import { getPatientContext } from "@/server/patient/patient-context";
import { patientPortalService } from "@/server/patient/patient-portal.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/patient/diagnoses — the active record's diagnosis history.
export async function GET(req: Request) {
  try {
    const ctx = await getPatientContext(req);
    const patientId =
      new URL(req.url).searchParams.get("patientId") ?? undefined;
    const result = await patientPortalService.listDiagnoses(ctx, patientId);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
