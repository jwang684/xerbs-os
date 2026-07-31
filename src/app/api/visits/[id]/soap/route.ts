import { getAuthContext } from "@/server/auth/context";
import { toErrorResponse } from "@/server/http/errors";
import { readJson } from "@/server/http/request";
import { soapService } from "@/server/soap/soap.service";

// The [id] segment is the visit id; a visit has at most one SOAP note.
type RouteContext = { params: Promise<{ id: string }> };

// GET /api/visits/:id/soap — read the visit's SOAP note.
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const note = await soapService.getByVisit(ctx, id);
    return Response.json({ data: note });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// POST /api/visits/:id/soap — create it (write roles; 409 if exists).
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const note = await soapService.create(ctx, id, body);
    return Response.json({ data: note }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// PATCH /api/visits/:id/soap — autosave a section update (write roles).
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const body = await readJson(req);
    const note = await soapService.update(ctx, id, body);
    return Response.json({ data: note });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// DELETE /api/visits/:id/soap — delete the note and its history (write roles).
export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const ctx = await getAuthContext(req);
    const { id } = await params;
    const note = await soapService.remove(ctx, id);
    return Response.json({ data: note });
  } catch (error) {
    return toErrorResponse(error);
  }
}
