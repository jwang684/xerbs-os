"use client";

import Link from "next/link";

import { PatientShell } from "@/components/patient-shell";
import { Card, ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type { DataResult, PatientDashboard } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const fmtDate = (iso: string) => iso.slice(0, 10);
const fmtDateTime = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;

export default function PatientDashboardPage() {
  const dash = useLoad<DataResult<PatientDashboard>>(
    () => api.get("/api/patient/dashboard"),
    [],
  );
  const d = dash.data?.data;

  return (
    <PatientShell>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900">
          {d ? `Welcome, ${d.name}` : "Welcome"}
        </h1>

        {dash.loading && <Loading />}
        {dash.error && <ErrorBox message={dash.error} />}

        {d && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <h2 className="text-sm font-semibold text-zinc-600">
                Upcoming appointment
              </h2>
              {d.upcomingAppointment ? (
                <p className="mt-1 text-sm text-zinc-800">
                  {fmtDateTime(d.upcomingAppointment.startTime)}
                  {d.upcomingAppointment.providerName
                    ? ` · ${d.upcomingAppointment.providerName}`
                    : ""}
                  {d.upcomingAppointment.organizationName
                    ? ` · ${d.upcomingAppointment.organizationName}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">None scheduled.</p>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-600">
                Active prescription
              </h2>
              {d.activePrescription ? (
                <p className="mt-1 text-sm text-zinc-800">
                  {d.activePrescription.structuredResult.formulaName}
                  <span className="text-zinc-500">
                    {" "}
                    · {fmtDate(d.activePrescription.createdAt)}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">None.</p>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-600">
                Recent diagnosis
              </h2>
              {d.recentDiagnosis ? (
                <p className="mt-1 text-sm text-zinc-800">
                  {d.recentDiagnosis.structuredResult.summary}
                  <span className="text-zinc-500">
                    {" "}
                    · {fmtDate(d.recentDiagnosis.createdAt)}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">None.</p>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-600">
                Recent visit
              </h2>
              {d.recentVisit ? (
                <p className="mt-1 text-sm text-zinc-800">
                  <Link
                    href={`/patient/visits/${d.recentVisit.id}`}
                    className="hover:underline"
                  >
                    {fmtDate(d.recentVisit.visitDate)} · {d.recentVisit.status}
                  </Link>
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">None yet.</p>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-600">
                Follow-up reminders
              </h2>
              <p className="mt-1 text-sm text-zinc-400">Coming soon.</p>
            </Card>
          </div>
        )}
      </div>
    </PatientShell>
  );
}
