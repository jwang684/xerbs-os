import { getPatientContext } from "@/server/patient/patient-context";
import { patientPortalService } from "@/server/patient/patient-portal.service";
import { toErrorResponse } from "@/server/http/errors";

// GET /api/patient/dashboard — aggregated summary for the active record.
export async function GET(req: Request) {
  try {
    const ctx = await getPatientContext(req);
    const patientId =
      new URL(req.url).searchParams.get("patientId") ?? undefined;
    const data = await patientPortalService.getDashboard(ctx, patientId);
    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
