import { z } from "zod";

export const visitIdParamSchema = z.uuid("Invalid visit id");
