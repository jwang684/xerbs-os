"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button, ErrorBox, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import type {
  Appointment,
  CalendarResult,
  ListResult,
  ProviderProfile,
} from "@/lib/api-types";
import { useLoad } from "@/lib/use-load";

const VIEWS = ["day", "week", "month"] as const;
type View = (typeof VIEWS)[number];

// All date math is UTC, matching the backend's grouping.
const todayUTC = () => new Date().toISOString().slice(0, 10);
const parse = (d: string) => new Date(`${d}T00:00:00.000Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
function addDays(d: string, n: number): string {
  const x = parse(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fmt(x);
}
function addMonths(d: string, n: number): string {
  const x = parse(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return fmt(x);
}
function shift(d: string, view: View, dir: number): string {
  if (view === "day") return addDays(d, dir);
  if (view === "week") return addDays(d, dir * 7);
  return addMonths(d, dir);
}
const hhmm = (iso: string) => iso.slice(11, 16);

function ApptItem({ a }: { a: Appointment }) {
  return (
    <Link
      href={`/appointments/${a.id}`}
      className="block rounded border border-zinc-200 bg-white px-2 py-1 text-xs hover:border-zinc-400"
    >
      <span className="font-medium">
        {hhmm(a.startTime)}–{hhmm(a.endTime)}
      </span>{" "}
      <span className="text-zinc-500">{a.status}</span>
    </Link>
  );
}

type ByDate = Map<string, Appointment[]>;

function DayView({ date, byDate }: { date: string; byDate: ByDate }) {
  const appts = byDate.get(date) ?? [];
  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold text-zinc-600">{date}</h2>
      {appts.length === 0 ? (
        <p className="text-sm text-zinc-500">No appointments.</p>
      ) : (
        appts.map((a) => <ApptItem key={a.id} a={a} />)
      )}
    </div>
  );
}

function WeekView({ from, byDate }: { from: string; byDate: ByDate }) {
  const start = from.slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((d) => (
        <div key={d} className="rounded border border-zinc-200 p-2">
          <div className="mb-1 text-xs font-semibold text-zinc-600">
            {d.slice(5)}
          </div>
          <div className="space-y-1">
            {(byDate.get(d) ?? []).map((a) => (
              <ApptItem key={a.id} a={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({ anchor, byDate }: { anchor: string; byDate: ByDate }) {
  const monthFirst = `${anchor.slice(0, 7)}-01`;
  const offset = (parse(monthFirst).getUTCDay() + 6) % 7;
  const gridStart = addDays(monthFirst, -offset);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const month = anchor.slice(0, 7);
  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((d) => {
        const inMonth = d.slice(0, 7) === month;
        return (
          <div
            key={d}
            className={`min-h-16 rounded border p-1 text-xs ${
              inMonth
                ? "border-zinc-200"
                : "border-zinc-100 bg-zinc-50 text-zinc-400"
            }`}
          >
            <div className="mb-0.5">{d.slice(8)}</div>
            <div className="space-y-0.5">
              {(byDate.get(d) ?? []).map((a) => (
                <ApptItem key={a.id} a={a} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<string>(todayUTC());
  const [providerId, setProviderId] = useState<string>("");

  const providers = useLoad<ListResult<ProviderProfile>>(
    () => api.get("/api/providers"),
    [],
  );
  const cal = useLoad<CalendarResult>(
    () =>
      api.get(
        `/api/appointments/calendar?view=${view}&date=${anchor}${
          providerId ? `&providerId=${providerId}` : ""
        }`,
      ),
    [view, anchor, providerId],
  );

  const byDate: ByDate = new Map(
    (cal.data?.groups ?? []).map((g) => [g.date, g.appointments]),
  );

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-zinc-900">Calendar</h1>
          <div className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded px-2 py-1 text-sm capitalize ${
                  v === view
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 text-zinc-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setAnchor(shift(anchor, view, -1))}>
            ← Prev
          </Button>
          <Button onClick={() => setAnchor(todayUTC())}>Today</Button>
          <Button onClick={() => setAnchor(shift(anchor, view, 1))}>
            Next →
          </Button>
          {cal.data && (
            <span className="text-sm text-zinc-600">
              {cal.data.from.slice(0, 10)} → {cal.data.to.slice(0, 10)}
            </span>
          )}
          <select
            aria-label="Provider filter"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="ml-auto rounded border border-zinc-300 px-2 py-1 text-sm"
          >
            <option value="">All providers</option>
            {providers.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.specialty || `Provider ${p.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        {cal.loading && <Loading />}
        {cal.error && <ErrorBox message={cal.error} />}
        {cal.data && view === "day" && (
          <DayView date={anchor} byDate={byDate} />
        )}
        {cal.data && view === "week" && (
          <WeekView from={cal.data.from} byDate={byDate} />
        )}
        {cal.data && view === "month" && (
          <MonthView anchor={anchor} byDate={byDate} />
        )}
        <p className="text-xs text-zinc-400">Times shown in UTC.</p>
      </div>
    </AppShell>
  );
}
