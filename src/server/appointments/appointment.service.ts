import type { Appointment, Visit } from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../http/errors";
import { validate } from "../http/validate";
import { patientRepository } from "../patients/patient.repository";
import { providerRepository } from "../providers/provider.repository";
import {
  appointmentRepository,
  type ListAppointmentsResult,
} from "./appointment.repository";
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from "./appointment.schema";

/** The provider-profile id for a practitioner, or null if they have none. */
async function ownProviderId(ctx: AuthContext): Promise<string | null> {
  const profile = await providerRepository.findByUser(
    ctx.organizationId,
    ctx.userId,
  );
  return profile?.id ?? null;
}

/**
 * Appointment business logic.
 *
 * Authorization:
 *   - owner/admin: full CRUD on all appointments.
 *   - staff: create/read/update on all; may NOT delete.
 *   - practitioner: CRUD only for appointments assigned to their own provider
 *     profile.
 *
 * Validation: endTime > startTime; patient and provider must belong to the
 * organization; no overlapping (non-cancelled) appointments for the same
 * provider.
 */
export const appointmentService = {
  async create(ctx: AuthContext, input: unknown): Promise<Appointment> {
    const data = validate(createAppointmentSchema, input);

    if (ctx.role === "practitioner") {
      const own = await ownProviderId(ctx);
      if (!own || data.providerId !== own) {
        throw new ForbiddenError(
          "Practitioners can only create appointments assigned to themselves",
        );
      }
    }

    const patient = await patientRepository.findById(
      ctx.organizationId,
      data.patientId,
    );
    if (!patient) {
      throw new BadRequestError("Patient not found in organization");
    }
    const provider = await providerRepository.findById(
      ctx.organizationId,
      data.providerId,
    );
    if (!provider) {
      throw new BadRequestError("Provider not found in organization");
    }

    const overlap = await appointmentRepository.hasOverlap(
      ctx.organizationId,
      data.providerId,
      data.startTime,
      data.endTime,
    );
    if (overlap) {
      throw new ConflictError(
        "The provider has an overlapping appointment in that time range",
      );
    }

    return appointmentRepository.create(ctx.organizationId, data);
  },

  async get(ctx: AuthContext, id: string): Promise<Appointment> {
    const appointmentId = validate(appointmentIdParamSchema, id);
    const appointment = await appointmentRepository.findById(
      ctx.organizationId,
      appointmentId,
    );
    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }
    if (ctx.role === "practitioner") {
      const own = await ownProviderId(ctx);
      if (appointment.providerId !== own) {
        throw new ForbiddenError("Not your appointment");
      }
    }
    return appointment;
  },

  async update(
    ctx: AuthContext,
    id: string,
    input: unknown,
  ): Promise<Appointment> {
    const appointmentId = validate(appointmentIdParamSchema, id);
    const data = validate(updateAppointmentSchema, input);

    const existing = await appointmentRepository.findById(
      ctx.organizationId,
      appointmentId,
    );
    if (!existing) {
      throw new NotFoundError("Appointment not found");
    }

    if (ctx.role === "practitioner") {
      const own = await ownProviderId(ctx);
      if (existing.providerId !== own) {
        throw new ForbiddenError("Not your appointment");
      }
    }

    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    if (endTime <= startTime) {
      throw new ValidationError("endTime must be after startTime");
    }

    if (data.startTime !== undefined || data.endTime !== undefined) {
      const overlap = await appointmentRepository.hasOverlap(
        ctx.organizationId,
        existing.providerId,
        startTime,
        endTime,
        existing.id,
      );
      if (overlap) {
        throw new ConflictError(
          "The provider has an overlapping appointment in that time range",
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const updated = await appointmentRepository.update(
      ctx.organizationId,
      appointmentId,
      data,
    );
    if (!updated) {
      throw new NotFoundError("Appointment not found");
    }
    return updated;
  },

  async remove(ctx: AuthContext, id: string): Promise<Appointment> {
    const appointmentId = validate(appointmentIdParamSchema, id);
    const existing = await appointmentRepository.findById(
      ctx.organizationId,
      appointmentId,
    );
    if (!existing) {
      throw new NotFoundError("Appointment not found");
    }

    if (ctx.role === "staff") {
      throw new ForbiddenError("Staff cannot delete appointments");
    }
    if (ctx.role === "practitioner") {
      const own = await ownProviderId(ctx);
      if (existing.providerId !== own) {
        throw new ForbiddenError("Not your appointment");
      }
    }

    await appointmentRepository.remove(ctx.organizationId, appointmentId);
    return existing;
  },

  /**
   * Checks in a scheduled appointment, creating its linked visit (transactional,
   * exactly once). Allowed for owner/admin/staff, and for the practitioner
   * assigned to the appointment. Only `scheduled` appointments may be checked in.
   */
  async checkIn(
    ctx: AuthContext,
    id: string,
  ): Promise<{ appointment: Appointment; visit: Visit }> {
    const appointmentId = validate(appointmentIdParamSchema, id);
    const existing = await appointmentRepository.findById(
      ctx.organizationId,
      appointmentId,
    );
    if (!existing) {
      throw new NotFoundError("Appointment not found");
    }

    if (ctx.role === "practitioner") {
      const own = await ownProviderId(ctx);
      if (existing.providerId !== own) {
        throw new ForbiddenError("Not your appointment");
      }
    }

    if (existing.status !== "scheduled") {
      throw new ConflictError(
        "Only scheduled appointments can be checked in",
      );
    }

    const result = await appointmentRepository.checkIn(
      ctx.organizationId,
      appointmentId,
    );
    if (!result) {
      // Lost a race: the appointment is no longer scheduled.
      throw new ConflictError("Appointment is no longer scheduled");
    }
    return result;
  },

  async list(
    ctx: AuthContext,
    query: unknown,
  ): Promise<ListAppointmentsResult> {
    const { providerId, patientId, from, to, limit, offset } = validate(
      listAppointmentsQuerySchema,
      query,
    );

    let effectiveProviderId = providerId;
    if (ctx.role === "practitioner") {
      const own = await ownProviderId(ctx);
      if (!own) {
        return { items: [], total: 0 };
      }
      // Practitioners only ever see their own appointments.
      effectiveProviderId = own;
    }

    return appointmentRepository.list(ctx.organizationId, {
      providerId: effectiveProviderId,
      patientId,
      from,
      to,
      limit,
      offset,
    });
  },
};
