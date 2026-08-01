import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { patients } from "@/db/schema";
import { auth } from "@/lib/auth";

import { ForbiddenError, UnauthorizedError } from "../http/errors";

/**
 * The authenticated patient's portal identity.
 *
 * Unlike the clinic-side {@link import("../auth/context").getAuthContext}, the
 * patient portal is **organization-agnostic**: a person may be a patient at
 * several clinics, so a single user maps to one or more `patients` rows (across
 * organizations). Every portal query is scoped to `patientIds` — resolved here
 * solely from the session — never from a URL/body parameter.
 */
export interface PatientContext {
  userId: string;
  name: string;
  email: string;
  /** All active patient records linked to this user (>= 1). */
  patientIds: string[];
}

/**
 * Resolves the signed-in user and the patient record(s) they own.
 *
 * - 401 if there is no valid session.
 * - 403 if the account has no linked (active) patient record.
 */
export async function getPatientContext(req: Request): Promise<PatientContext> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const rows = await db
    .select({ id: patients.id })
    .from(patients)
    .where(
      and(eq(patients.userId, session.user.id), isNull(patients.deletedAt)),
    );

  if (rows.length === 0) {
    throw new ForbiddenError("No patient record is linked to this account");
  }

  return {
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    patientIds: rows.map((r) => r.id),
  };
}
