"use client";

import Link from "next/link";

import { PatientShell } from "@/components/patient-shell";
import { ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type { ListResult, PatientVisitListItem } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const fmtDate = (iso: string) => iso.slice(0, 10);

export default function PatientVisitsPage() {
  const visits = useLoad<ListResult<PatientVisitListItem>>(
    () => api.get("/api/patient/visits"),
    [],
  );

  return (
    <PatientShell>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900">My Visits</h1>

        {visits.loading && <Loading />}
        {visits.error && <ErrorBox message={visits.error} />}

        {visits.data &&
          (visits.data.items.length === 0 ? (
            <p className="text-sm text-zinc-500">No visits yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visits.data.items.map((v) => (
                    <tr key={v.id} className="border-t border-zinc-100">
                      <td className="px-3 py-2 font-medium">
                        {fmtDate(v.visitDate)}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">
                        {v.providerName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{v.status}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/patient/visits/${v.id}`}
                          className="text-zinc-500 hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </PatientShell>
  );
}
