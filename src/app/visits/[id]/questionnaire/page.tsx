"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  Button,
  Card,
  ErrorBox,
  inputClass,
  Loading,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { DataResult, Questionnaire } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

interface Row {
  questionId: string;
  value: string;
}

const BLANK: Row = { questionId: "", value: "" };

function QuestionnaireForm({
  visitId,
  initial,
  onSaved,
}: {
  visitId: string;
  initial: Questionnaire | null;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial && initial.answers.responses.length
      ? initial.answers.responses.map((r) => ({
          questionId: r.questionId,
          value: String(r.value ?? ""),
        }))
      : [{ ...BLANK }],
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const responses = rows
      .filter((r) => r.questionId.trim())
      .map((r) => ({ questionId: r.questionId.trim(), value: r.value }));
    const payload = { answers: { responses } };
    try {
      if (initial) {
        await api.patch(`/api/visits/${visitId}/questionnaire`, payload);
      } else {
        await api.post(`/api/visits/${visitId}/questionnaire`, payload);
      }
      onSaved();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-zinc-500">
        {initial
          ? "Editing the saved questionnaire."
          : "No questionnaire yet — add responses below."}
      </p>
      <form onSubmit={onSave} className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={`${inputClass} flex-1`}
              placeholder="Question id (e.g. sleep)"
              value={row.questionId}
              onChange={(e) => updateRow(i, { questionId: e.target.value })}
            />
            <input
              className={`${inputClass} flex-1`}
              placeholder="Answer"
              value={row.value}
              onChange={(e) => updateRow(i, { value: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-zinc-500 hover:underline"
          onClick={() => setRows((prev) => [...prev, { ...BLANK }])}
        >
          + Add response
        </button>
        {saveError && <ErrorBox message={saveError} />}
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : initial ? "Update" : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function QuestionnairePage() {
  const { id } = useParams<{ id: string }>();

  const existing = useLoad<Questionnaire | null>(async () => {
    try {
      const r = await api.get<DataResult<Questionnaire>>(
        `/api/visits/${id}/questionnaire`,
      );
      return r.data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }, [id]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/visits/${id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Visit
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Questionnaire</h1>

        {existing.loading && <Loading />}
        {existing.error && <ErrorBox message={existing.error} />}
        {!existing.loading && !existing.error && (
          <QuestionnaireForm
            key={existing.data ? existing.data.id : "new"}
            visitId={id}
            initial={existing.data}
            onSaved={existing.reload}
          />
        )}
      </div>
    </AppShell>
  );
}
