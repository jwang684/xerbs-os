import { getPatientContext } from "@/server/patient/patient-context";
import { patientPortalService } from "@/server/patient/patient-portal.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/patient/prescriptions — the active record's prescription history.
export async function GET(req: Request) {
  try {
    const ctx = await getPatientContext(req);
    const patientId =
      new URL(req.url).searchParams.get("patientId") ?? undefined;
    const result = await patientPortalService.listPrescriptions(ctx, patientId);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
