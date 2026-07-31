"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button, Card, ErrorBox, Field, Loading } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { DataResult, Visit, VisitStatus } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const STEPS = [
  { slug: "questionnaire", label: "Questionnaire" },
  { slug: "diagnosis", label: "Diagnosis" },
  { slug: "prescription", label: "Prescription" },
];

function StatusForm({
  visitId,
  initialStatus,
  onSaved,
}: {
  visitId: string;
  initialStatus: VisitStatus;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<VisitStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch(`/api/visits/${visitId}`, { status });
      onSaved();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-end gap-3">
        <Field label="Status">
          <select
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as VisitStatus)}
          >
            <option value="open">open</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </Field>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      {saveError && (
        <div className="mt-2">
          <ErrorBox message={saveError} />
        </div>
      )}
    </Card>
  );
}

export default function VisitPage() {
  const { id } = useParams<{ id: string }>();
  const visit = useLoad<DataResult<Visit>>(
    () => api.get(`/api/visits/${id}`),
    [id],
  );

  const v = visit.data?.data;

  return (
    <AppShell>
      <div className="space-y-6">
        {v && (
          <Link
            href={`/patients/${v.patientId}`}
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Patient
          </Link>
        )}

        {visit.loading && <Loading />}
        {visit.error && <ErrorBox message={visit.error} />}
        {v && (
          <>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">
                {v.chiefComplaint || "Visit"}
              </h1>
              <p className="text-sm text-zinc-500">
                {new Date(v.visitDate).toLocaleString()}
              </p>
            </div>

            <StatusForm
              key={v.status}
              visitId={id}
              initialStatus={v.status}
              onSaved={visit.reload}
            />

            <div className="grid gap-2">
              {STEPS.map((s) => (
                <Link
                  key={s.slug}
                  href={`/visits/${id}/${s.slug}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
                >
                  <span className="font-medium text-zinc-900">{s.label}</span>
                  <span className="text-zinc-400">→</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
