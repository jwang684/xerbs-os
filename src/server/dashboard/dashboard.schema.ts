import { z } from "zod";

export const dashboardQuerySchema = z.object({
  providerId: z.uuid().optional(),
  date: z.iso.date().optional(), // anchor day for "today" widgets (UTC)
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
