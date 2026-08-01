"use client";

import Link from "next/link";

import { PatientShell } from "@/components/patient-shell";
import { Card, ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type { ListResult, PatientDiagnosisItem } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const fmtDate = (iso: string) => iso.slice(0, 10);

export default function PatientDiagnosesPage() {
  const dx = useLoad<ListResult<PatientDiagnosisItem>>(
    () => api.get("/api/patient/diagnoses"),
    [],
  );

  return (
    <PatientShell>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900">My Diagnoses</h1>

        {dx.loading && <Loading />}
        {dx.error && <ErrorBox message={dx.error} />}

        {dx.data &&
          (dx.data.items.length === 0 ? (
            <p className="text-sm text-zinc-500">No diagnoses yet.</p>
          ) : (
            <div className="space-y-3">
              {dx.data.items.map((d) => (
                <Card key={d.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {d.structuredResult.summary}
                    </p>
                    <span className="text-xs text-zinc-400">
                      {fmtDate(d.createdAt)}
                    </span>
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-sm text-zinc-700">
                    {d.structuredResult.patterns.map((pat, i) => (
                      <li key={i}>
                        <span className="font-medium">{pat.name}</span> —{" "}
                        {pat.rationale}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-zinc-400">
                    <Link
                      href={`/patient/visits/${d.visitId}`}
                      className="hover:underline"
                    >
                      View visit
                    </Link>
                    {d.organizationName ? ` · ${d.organizationName}` : ""}
                  </p>
                </Card>
              ))}
            </div>
          ))}
      </div>
    </PatientShell>
  );
}
