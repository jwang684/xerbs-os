import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  questionnaireResponses,
  type QuestionnaireResponse,
} from "@/db/schema";

export interface CreateQuestionnaireData {
  visitId: string;
  patientId: string;
  schemaVersion: number;
  answers: Record<string, unknown>;
}

export interface UpdateQuestionnaireData {
  schemaVersion: number;
  answers: Record<string, unknown>;
}

/**
 * Pure data access for questionnaires. Every method is scoped by
 * `organizationId`. A visit has at most one questionnaire (unique visit_id), so
 * lookups are keyed by visit.
 */
export const questionnaireRepository = {
  async findByVisit(
    organizationId: string,
    visitId: string,
  ): Promise<QuestionnaireResponse | null> {
    const [row] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.organizationId, organizationId),
          eq(questionnaireResponses.visitId, visitId),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async create(
    organizationId: string,
    data: CreateQuestionnaireData,
  ): Promise<QuestionnaireResponse> {
    const [row] = await db
      .insert(questionnaireResponses)
      .values({ ...data, organizationId })
      .returning();
    return row;
  },

  async updateByVisit(
    organizationId: string,
    visitId: string,
    data: UpdateQuestionnaireData,
  ): Promise<QuestionnaireResponse | null> {
    const [row] = await db
      .update(questionnaireResponses)
      .set(data)
      .where(
        and(
          eq(questionnaireResponses.organizationId, organizationId),
          eq(questionnaireResponses.visitId, visitId),
        ),
      )
      .returning();
    return row ?? null;
  },
};
