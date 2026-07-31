import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  soapNoteRevisions,
  soapNotes,
  type SoapNote,
  type SoapNoteRevision,
} from "@/db/schema";

export interface SoapSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export const soapRepository = {
  async findByVisit(
    organizationId: string,
    visitId: string,
  ): Promise<SoapNote | null> {
    const [row] = await db
      .select()
      .from(soapNotes)
      .where(
        and(
          eq(soapNotes.organizationId, organizationId),
          eq(soapNotes.visitId, visitId),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  /** Creates the note and its first immutable revision (transactionally). */
  async create(
    organizationId: string,
    data: {
      visitId: string;
      patientId: string;
      sections: SoapSections;
      authorId: string;
    },
  ): Promise<SoapNote> {
    return db.transaction(async (tx) => {
      const [note] = await tx
        .insert(soapNotes)
        .values({
          organizationId,
          visitId: data.visitId,
          patientId: data.patientId,
          ...data.sections,
          version: 1,
        })
        .returning();
      await tx.insert(soapNoteRevisions).values({
        organizationId,
        soapNoteId: note.id,
        visitId: data.visitId,
        version: 1,
        ...data.sections,
        authorId: data.authorId,
      });
      return note;
    });
  },

  /**
   * Applies a partial section patch: bumps the version, updates the current
   * note, and appends an immutable revision — all in one transaction. Returns
   * null if there is no note for the visit. Row is locked to serialize
   * concurrent autosaves.
   */
  async update(
    organizationId: string,
    visitId: string,
    patch: Partial<SoapSections>,
    authorId: string,
  ): Promise<SoapNote | null> {
    return db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(soapNotes)
        .where(
          and(
            eq(soapNotes.organizationId, organizationId),
            eq(soapNotes.visitId, visitId),
          ),
        )
        .for("update")
        .limit(1);
      if (!current) return null;

      const merged: SoapSections = {
        subjective: patch.subjective ?? current.subjective,
        objective: patch.objective ?? current.objective,
        assessment: patch.assessment ?? current.assessment,
        plan: patch.plan ?? current.plan,
      };
      const version = current.version + 1;

      const [note] = await tx
        .update(soapNotes)
        .set({ ...merged, version })
        .where(eq(soapNotes.id, current.id))
        .returning();
      await tx.insert(soapNoteRevisions).values({
        organizationId,
        soapNoteId: current.id,
        visitId,
        version,
        ...merged,
        authorId,
      });
      return note;
    });
  },

  async remove(organizationId: string, visitId: string): Promise<boolean> {
    const rows = await db
      .delete(soapNotes)
      .where(
        and(
          eq(soapNotes.organizationId, organizationId),
          eq(soapNotes.visitId, visitId),
        ),
      )
      .returning({ id: soapNotes.id });
    return rows.length > 0;
  },

  async listRevisions(
    organizationId: string,
    visitId: string,
  ): Promise<SoapNoteRevision[]> {
    return db
      .select()
      .from(soapNoteRevisions)
      .where(
        and(
          eq(soapNoteRevisions.organizationId, organizationId),
          eq(soapNoteRevisions.visitId, visitId),
        ),
      )
      .orderBy(desc(soapNoteRevisions.version));
  },
};
