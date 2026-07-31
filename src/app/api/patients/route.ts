import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { patientService } from "@/server/patients/patient.service";

// GET /api/patients?q=&limit=&offset=  — list or search patients (any member).
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const result = await patientService.list(ctx, {
      q: url.searchParams.get("q") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/patients — create a patient (write roles only).
export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = await readJson(req);
    const patient = await patientService.create(ctx, body);
    return Response.json({ data: patient }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
