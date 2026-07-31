"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type {
  DashboardResult,
  DashboardWidgets,
  ListResult,
  ProviderProfile,
} from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const todayUTC = () => new Date().toISOString().slice(0, 10);
const hhmm = (iso: string) => iso.slice(11, 16);

// Widget cards, in display order, with the metric key each reads.
const WIDGETS: Array<{ key: keyof DashboardWidgets; label: string }> = [
  { key: "todaysAppointments", label: "Today's appointments" },
  { key: "waitingPatients", label: "Waiting" },
  { key: "checkedInPatients", label: "Checked in" },
  { key: "openVisits", label: "Open visits" },
  { key: "completedVisits", label: "Completed visits" },
  { key: "pendingSoap", label: "Pending SOAP" },
  { key: "pendingDiagnosis", label: "Pending diagnosis" },
  { key: "pendingPrescription", label: "Pending prescription" },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [date, setDate] = useState<string>(todayUTC());
  const [providerId, setProviderId] = useState<string>("");

  const providers = useLoad<ListResult<ProviderProfile>>(
    () => api.get("/api/providers"),
    [],
  );
  const dash = useLoad<DashboardResult>(
    () =>
      api.get(
        `/api/dashboard?date=${date}${
          providerId ? `&providerId=${providerId}` : ""
        }`,
      ),
    [date, providerId],
  );

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Dashboard date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayUTC())}
              className="rounded border border-zinc-300 px-2 py-1 text-sm"
            />
            <select
              aria-label="Provider filter"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              <option value="">All providers</option>
              {providers.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.specialty || `Provider ${p.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {dash.loading && <Loading />}
        {dash.error && <ErrorBox message={dash.error} />}

        {dash.data && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {WIDGETS.map((w) => (
                <StatCard
                  key={w.key}
                  label={w.label}
                  value={dash.data!.widgets[w.key]}
                />
              ))}
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-600">
                Today&apos;s appointments
              </h2>
              {dash.data.todaysAppointments.length === 0 ? (
                <p className="text-sm text-zinc-500">No appointments.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.data.todaysAppointments.map((a) => (
                        <tr key={a.id} className="border-t border-zinc-100">
                          <td className="px-3 py-2 font-medium">
                            {hhmm(a.startTime)}–{hhmm(a.endTime)}
                          </td>
                          <td className="px-3 py-2 text-zinc-600">{a.status}</td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              href={`/appointments/${a.id}`}
                              className="text-zinc-500 hover:underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        <p className="text-xs text-zinc-400">Times shown in UTC.</p>
      </div>
    </AppShell>
  );
}
