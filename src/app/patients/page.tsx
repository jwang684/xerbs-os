"use client";

import Link from "next/link";
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
import type { ListResult, Patient } from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

export default function PatientsPage() {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const list = useLoad<ListResult<Patient>>(
    () =>
      api.get(
        `/api/patients${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      ),
    [query],
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/api/patients", {
        fullName,
        email: email || undefined,
      });
      setFullName("");
      setEmail("");
      list.reload();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-zinc-900">Patients</h1>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-zinc-700">
            Add patient
          </h2>
          <form onSubmit={onCreate} className="space-y-3">
            <Field label="Full name">
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email (optional)">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {createError && <ErrorBox message={createError} />}
            <Button type="submit" disabled={creating}>
              {creating ? "Adding…" : "Add patient"}
            </Button>
          </form>
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(term.trim());
          }}
          className="flex gap-2"
        >
          <input
            className={`${inputClass} flex-1`}
            placeholder="Search by name or email"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        {list.loading && <Loading />}
        {list.error && <ErrorBox message={list.error} />}
        {list.data && (
          <div className="space-y-2">
            {list.data.items.length === 0 && (
              <p className="text-sm text-zinc-500">No patients found.</p>
            )}
            {list.data.items.map((p) => (
              <Link
                key={p.id}
                href={`/patients/${p.id}`}
                className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
              >
                <div className="font-medium text-zinc-900">{p.fullName}</div>
                {p.email && (
                  <div className="text-sm text-zinc-500">{p.email}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
