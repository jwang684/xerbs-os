import { z } from "zod";

export const appointmentStatusValues = [
  "scheduled",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
] as const;

const statusSchema = z.enum(appointmentStatusValues);

export const createAppointmentSchema = z
  .object({
    patientId: z.uuid(),
    providerId: z.uuid(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    status: statusSchema.optional(),
    notes: z.string().max(5000).nullish(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

// Patient/provider assignment is immutable on update; times/status/notes only.
export const updateAppointmentSchema = z.object({
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  status: statusSchema.optional(),
  notes: z.string().max(5000).nullish(),
});

export const listAppointmentsQuerySchema = z.object({
  providerId: z.uuid().optional(),
  patientId: z.uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const appointmentIdParamSchema = z.uuid("Invalid appointment id");

export const calendarViewValues = ["day", "week", "month"] as const;

export const calendarQuerySchema = z.object({
  view: z.enum(calendarViewValues),
  date: z.iso.date(), // anchor date (YYYY-MM-DD), interpreted in UTC
  providerId: z.uuid().optional(),
});

export type CalendarView = (typeof calendarViewValues)[number];
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
