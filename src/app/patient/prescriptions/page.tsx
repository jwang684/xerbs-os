"use client";

import Link from "next/link";

import { PatientShell } from "@/components/patient-shell";
import { Card, ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type { ListResult, PatientPrescriptionItem } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const fmtDate = (iso: string) => iso.slice(0, 10);

export default function PatientPrescriptionsPage() {
  const rx = useLoad<ListResult<PatientPrescriptionItem>>(
    () => api.get("/api/patient/prescriptions"),
    [],
  );

  return (
    <PatientShell>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900">
          My Prescriptions
        </h1>

        {rx.loading && <Loading />}
        {rx.error && <ErrorBox message={rx.error} />}

        {rx.data &&
          (rx.data.items.length === 0 ? (
            <p className="text-sm text-zinc-500">No prescriptions yet.</p>
          ) : (
            <div className="space-y-3">
              {rx.data.items.map((r) => (
                <Card key={r.id}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {r.structuredResult.formulaName}
                    </p>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        r.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Prescribed {fmtDate(r.createdAt)}
                    {r.organizationName ? ` · ${r.organizationName}` : ""}
                  </div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700">
                    {r.structuredResult.herbs.map((h, i) => (
                      <li key={i}>
                        {h.name} — {h.dosage}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-sm text-zinc-700">
                    {r.structuredResult.instructions}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    <Link
                      href={`/patient/visits/${r.visitId}`}
                      className="hover:underline"
                    >
                      View visit
                    </Link>
                  </p>
                </Card>
              ))}
            </div>
          ))}
      </div>
    </PatientShell>
  );
}
