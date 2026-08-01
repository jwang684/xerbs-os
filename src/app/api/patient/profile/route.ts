import { getPatientContext } from "@/server/patient/patient-context";
import { patientPortalService } from "@/server/patient/patient-portal.service";
import { toErrorResponse } from "@/server/http/errors";

// The optional record selector (one of the caller's own patient ids).
function selector(req: Request): string | undefined {
  return new URL(req.url).searchParams.get("patientId") ?? undefined;
}

// GET /api/patient/profile — the signed-in patient's profile (active record).
export async function GET(req: Request) {
  try {
    const ctx = await getPatientContext(req);
    const data = await patientPortalService.getProfile(ctx, selector(req));
    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/patient/profile — update contact info / address (active record).
export async function PATCH(req: Request) {
  try {
    const ctx = await getPatientContext(req);
    const body = await req.json().catch(() => ({}));
    const data = await patientPortalService.updateProfile(
      ctx,
      selector(req),
      body,
    );
    return Response.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
