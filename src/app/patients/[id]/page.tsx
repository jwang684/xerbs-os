"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import {
  Button,
  Card,
  ErrorBox,
  Field,
  inputClass,
  Loading,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { DataResult, ListResult, Patient, Visit } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const patient = useLoad<DataResult<Patient>>(
    () => api.get(`/api/patients/${id}`),
    [id],
  );
  const visits = useLoad<ListResult<Visit>>(
    () => api.get(`/api/visits?patientId=${id}`),
    [id],
  );

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function onCreateVisit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/api/visits", {
        patientId: id,
        chiefComplaint: chiefComplaint || undefined,
      });
      setChiefComplaint("");
      visits.reload();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link href="/patients" className="text-sm text-zinc-500 hover:underline">
          ← Patients
        </Link>

        {patient.loading && <Loading />}
        {patient.error && <ErrorBox message={patient.error} />}
        {patient.data && (
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {patient.data.data.fullName}
            </h1>
            <p className="text-sm text-zinc-500">
              {patient.data.data.email ?? "No email"} ·{" "}
              {patient.data.data.sex}
            </p>
          </div>
        )}

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">New visit</h2>
          <form onSubmit={onCreateVisit} className="space-y-3">
            <Field label="Chief complaint (optional)">
              <input
                className={inputClass}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
            </Field>
            {createError && <ErrorBox message={createError} />}
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Start visit"}
            </Button>
          </form>
        </Card>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-700">Visits</h2>
          {visits.loading && <Loading />}
          {visits.error && <ErrorBox message={visits.error} />}
          {visits.data && visits.data.items.length === 0 && (
            <p className="text-sm text-zinc-500">No visits yet.</p>
          )}
          {visits.data?.items.map((v) => (
            <Link
              key={v.id}
              href={`/visits/${v.id}`}
              className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-900">
                  {v.chiefComplaint || "Visit"}
                </span>
                <span className="text-xs uppercase text-zinc-500">
                  {v.status}
                </span>
              </div>
              <div className="text-sm text-zinc-500">
                {new Date(v.visitDate).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
