"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { PatientShell } from "@/components/patient-shell";
import { Card, ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type { DataResult, PatientVisitDetail } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const fmtDate = (iso: string) => iso.slice(0, 10);

export default function PatientVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const detail = useLoad<DataResult<PatientVisitDetail>>(
    () => api.get(`/api/patient/visits/${id}`),
    [id],
  );
  const d = detail.data?.data;

  return (
    <PatientShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">Visit</h1>
          <Link
            href="/patient/visits"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Back to visits
          </Link>
        </div>

        {detail.loading && <Loading />}
        {detail.error && <ErrorBox message={detail.error} />}

        {d && (
          <div className="space-y-4">
            <Card>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-zinc-500">Date</div>
                  <div className="font-medium">{fmtDate(d.visit.visitDate)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Status</div>
                  <div className="font-medium">{d.visit.status}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Provider</div>
                  <div className="font-medium">
                    {d.visit.providerName ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">Clinic</div>
                  <div className="font-medium">
                    {d.visit.organizationName ?? "—"}
                  </div>
                </div>
              </div>
              {d.visit.chiefComplaint && (
                <p className="mt-2 text-sm">
                  <span className="text-zinc-500">Chief complaint: </span>
                  {d.visit.chiefComplaint}
                </p>
              )}
            </Card>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-600">SOAP note</h2>
              {d.soap ? (
                <Card>
                  <dl className="space-y-2 text-sm">
                    <SoapRow label="Subjective" text={d.soap.subjective} />
                    <SoapRow label="Objective" text={d.soap.objective} />
                    <SoapRow label="Assessment" text={d.soap.assessment} />
                    <SoapRow label="Plan" text={d.soap.plan} />
                  </dl>
                </Card>
              ) : (
                <p className="text-sm text-zinc-500">No SOAP note.</p>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-600">Diagnosis</h2>
              {d.diagnoses.length === 0 ? (
                <p className="text-sm text-zinc-500">No diagnosis.</p>
              ) : (
                d.diagnoses.map((dx) => (
                  <Card key={dx.id}>
                    <p className="text-sm font-medium">
                      {dx.structuredResult.summary}
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-zinc-700">
                      {dx.structuredResult.patterns.map((pat, i) => (
                        <li key={i}>
                          <span className="font-medium">{pat.name}</span> —{" "}
                          {pat.rationale}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs text-zinc-400">{dx.disclaimer}</p>
                  </Card>
                ))
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-zinc-600">
                Prescription
              </h2>
              {d.prescriptions.length === 0 ? (
                <p className="text-sm text-zinc-500">No prescription.</p>
              ) : (
                d.prescriptions.map((rx) => (
                  <Card key={rx.id}>
                    <p className="text-sm font-medium">
                      {rx.structuredResult.formulaName}
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-zinc-700">
                      {rx.structuredResult.herbs.map((h, i) => (
                        <li key={i}>
                          {h.name} — {h.dosage}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-sm text-zinc-700">
                      {rx.structuredResult.instructions}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{rx.disclaimer}</p>
                  </Card>
                ))
              )}
            </section>
          </div>
        )}
      </div>
    </PatientShell>
  );
}

function SoapRow({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="whitespace-pre-wrap">{text || "—"}</dd>
    </div>
  );
}
