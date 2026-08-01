import { z } from "zod";

// SOAP sections are plain text / markdown. All optional so partial autosaves
// (a single section at a time) are valid.
const section = z.string().max(20000);

const sectionFields = {
  subjective: section.optional(),
  objective: section.optional(),
  assessment: section.optional(),
  plan: section.optional(),
};

export const createSoapSchema = z.object(sectionFields);
export const updateSoapSchema = z.object(sectionFields);

export const visitIdParamSchema = z.uuid("Invalid visit id");

export type CreateSoapInput = z.infer<typeof createSoapSchema>;
export type UpdateSoapInput = z.infer<typeof updateSoapSchema>;
