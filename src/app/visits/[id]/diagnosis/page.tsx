"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button, Card, ErrorBox, Loading } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Diagnosis, ListResult } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

export default function DiagnosisPage() {
  const { id } = useParams<{ id: string }>();
  const diagnoses = useLoad<ListResult<Diagnosis>>(
    () => api.get(`/api/visits/${id}/diagnosis`),
    [id],
  );

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      diagnoses.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={`/visits/${id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Visit
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Diagnosis</h1>
          <Button
            disabled={busy}
            onClick={() => run(() => api.post(`/api/visits/${id}/diagnosis`))}
          >
            {busy ? "Working…" : "Generate diagnosis"}
          </Button>
        </div>

        {actionError && <ErrorBox message={actionError} />}
        {diagnoses.loading && <Loading />}
        {diagnoses.error && <ErrorBox message={diagnoses.error} />}

        {diagnoses.data && diagnoses.data.items.length === 0 && (
          <p className="text-sm text-zinc-500">
            No diagnoses yet. Generate one (requires a questionnaire).
          </p>
        )}

        <div className="space-y-3">
          {diagnoses.data?.items.map((d) => (
            <Card key={d.id}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-800">
                  {d.structuredResult.summary}
                </span>
                {d.isActive ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    active
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-zinc-500 hover:underline"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        api.post(
                          `/api/visits/${id}/diagnosis/${d.id}/activate`,
                        ),
                      )
                    }
                  >
                    Make active
                  </button>
                )}
              </div>
              <ul className="mb-2 list-disc pl-5 text-sm text-zinc-700">
                {d.structuredResult.patterns.map((p, i) => (
                  <li key={i}>
                    <span className="font-medium">{p.name}</span> — {p.rationale}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-zinc-400">
                {d.provider}/{d.model} · confidence{" "}
                {d.confidence ?? "n/a"} ·{" "}
                {new Date(d.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 text-xs italic text-zinc-400">{d.disclaimer}</p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
