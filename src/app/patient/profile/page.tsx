"use client";

import { useState } from "react";

import { PatientShell } from "@/components/patient-shell";
import { Button, ErrorBox, Field, inputClass, Loading } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type {
  DataResult,
  PatientAddress,
  PatientProfile,
} from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

type AddressForm = Required<{ [K in keyof PatientAddress]: string }>;
const emptyAddress: AddressForm = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export default function PatientProfilePage() {
  // The selected record (Phase 1 normally a single record; selector shown when
  // the user has more than one).
  const [selected, setSelected] = useState<string>("");
  const query = selected ? `?patientId=${selected}` : "";

  const prof = useLoad<DataResult<PatientProfile>>(
    () => api.get(`/api/patient/profile${query}`),
    [selected],
  );
  const p = prof.data?.data;

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Reset the form when a different record loads — the documented
  // "adjust state during render" pattern (no effect, no cascading renders).
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (p && p.activePatientId !== syncedId) {
    setSyncedId(p.activePatientId);
    setEmail(p.contact.email ?? "");
    setPhone(p.contact.phone ?? "");
    setAddress({ ...emptyAddress, ...(p.contact.address ?? {}) });
    setSaved(false);
    setSaveError(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    // Send only address parts that were filled; empty strings clear a field.
    const addr: PatientAddress = {};
    for (const k of Object.keys(address) as (keyof AddressForm)[]) {
      const v = address[k].trim();
      if (v) addr[k] = v;
    }
    try {
      await api.patch(`/api/patient/profile${query}`, {
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: Object.keys(addr).length ? addr : null,
      });
      setSaved(true);
      prof.reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PatientShell>
      <div className="max-w-lg space-y-4">
        <h1 className="text-xl font-semibold text-zinc-900">My Profile</h1>

        {prof.loading && <Loading />}
        {prof.error && <ErrorBox message={prof.error} />}

        {p && (
          <>
            {p.records.length > 1 && (
              <Field label="Record / clinic">
                <select
                  className={inputClass}
                  value={selected || p.activePatientId}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {p.records.map((r) => (
                    <option key={r.patientId} value={r.patientId}>
                      {r.organizationName ?? "Clinic"} — {r.fullName}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
              <div className="text-zinc-500">Name</div>
              <div className="font-medium text-zinc-900">{p.name}</div>
              <div className="mt-2 text-zinc-500">Account email</div>
              <div className="font-medium text-zinc-900">{p.email}</div>
              <p className="mt-2 text-xs text-zinc-400">
                Name, date of birth and clinical records are managed by your
                clinic and cannot be edited here.
              </p>
            </div>

            <form
              onSubmit={onSave}
              className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4"
            >
              <h2 className="text-sm font-semibold text-zinc-700">
                Contact information
              </h2>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>

              <h2 className="pt-2 text-sm font-semibold text-zinc-700">
                Address
              </h2>
              <Field label="Line 1">
                <input
                  className={inputClass}
                  value={address.line1}
                  onChange={(e) =>
                    setAddress({ ...address, line1: e.target.value })
                  }
                />
              </Field>
              <Field label="Line 2">
                <input
                  className={inputClass}
                  value={address.line2}
                  onChange={(e) =>
                    setAddress({ ...address, line2: e.target.value })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="City">
                  <input
                    className={inputClass}
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                  />
                </Field>
                <Field label="State">
                  <input
                    className={inputClass}
                    value={address.state}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value })
                    }
                  />
                </Field>
                <Field label="Postal code">
                  <input
                    className={inputClass}
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress({ ...address, postalCode: e.target.value })
                    }
                  />
                </Field>
                <Field label="Country">
                  <input
                    className={inputClass}
                    value={address.country}
                    onChange={(e) =>
                      setAddress({ ...address, country: e.target.value })
                    }
                  />
                </Field>
              </div>

              {saveError && <ErrorBox message={saveError} />}
              {saved && (
                <p className="text-sm text-green-700">Saved.</p>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </>
        )}
      </div>
    </PatientShell>
  );
}
