import { z } from "zod";

export const visitIdParamSchema = z.uuid("Invalid visit id");
export const diagnosisIdParamSchema = z.uuid("Invalid diagnosis id");
