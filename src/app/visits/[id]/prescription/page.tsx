"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button, Card, ErrorBox, Loading } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { ListResult, Prescription } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

export default function PrescriptionPage() {
  const { id } = useParams<{ id: string }>();
  const prescriptions = useLoad<ListResult<Prescription>>(
    () => api.get(`/api/visits/${id}/prescription`),
    [id],
  );

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/api/visits/${id}/prescription`);
      prescriptions.reload();
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
          <h1 className="text-xl font-semibold text-zinc-900">Prescription</h1>
          <Button disabled={busy} onClick={generate}>
            {busy ? "Working…" : "Generate prescription"}
          </Button>
        </div>

        {actionError && <ErrorBox message={actionError} />}
        {prescriptions.loading && <Loading />}
        {prescriptions.error && <ErrorBox message={prescriptions.error} />}

        {prescriptions.data && prescriptions.data.items.length === 0 && (
          <p className="text-sm text-zinc-500">
            No prescriptions yet. Generate one (requires an active diagnosis).
          </p>
        )}

        <div className="space-y-3">
          {prescriptions.data?.items.map((p) => (
            <Card key={p.id}>
              <div className="mb-2 font-semibold text-zinc-800">
                {p.structuredResult.formulaName}
              </div>
              <table className="mb-2 w-full text-sm text-zinc-700">
                <tbody>
                  {p.structuredResult.herbs.map((h, i) => (
                    <tr key={i}>
                      <td className="py-0.5">{h.name}</td>
                      <td className="py-0.5 text-right text-zinc-500">
                        {h.dosage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-zinc-700">
                {p.structuredResult.instructions}
              </p>
              <p className="text-xs text-zinc-400">
                Duration: {p.structuredResult.durationDays} days · {p.provider}/
                {p.model} · {new Date(p.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 text-xs italic text-zinc-400">{p.disclaimer}</p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
