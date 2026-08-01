"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Card, ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type { Appointment, DataResult } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const utc = (iso: string) => new Date(iso).toISOString().replace("T", " ").slice(0, 16);

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const appt = useLoad<DataResult<Appointment>>(
    () => api.get(`/api/appointments/${id}`),
    [id],
  );
  const a = appt.data?.data;

  return (
    <AppShell>
      <div className="space-y-4">
        <Link href="/calendar" className="text-sm text-zinc-500 hover:underline">
          ← Calendar
        </Link>
        {appt.loading && <Loading />}
        {appt.error && <ErrorBox message={appt.error} />}
        {a && (
          <Card>
            <h1 className="mb-3 text-lg font-semibold text-zinc-900">
              Appointment
            </h1>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-sm">
              <dt className="text-zinc-500">Status</dt>
              <dd>{a.status}</dd>
              <dt className="text-zinc-500">Start</dt>
              <dd>{utc(a.startTime)} UTC</dd>
              <dt className="text-zinc-500">End</dt>
              <dd>{utc(a.endTime)} UTC</dd>
              <dt className="text-zinc-500">Patient</dt>
              <dd className="break-all">{a.patientId}</dd>
              <dt className="text-zinc-500">Provider</dt>
              <dd className="break-all">{a.providerId}</dd>
              <dt className="text-zinc-500">Notes</dt>
              <dd>{a.notes ?? "—"}</dd>
            </dl>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
