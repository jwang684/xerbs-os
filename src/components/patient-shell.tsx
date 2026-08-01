"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { signOut, useSession } from "@/lib/auth-client";

const NAV = [
  { href: "/patient", label: "Dashboard" },
  { href: "/patient/profile", label: "Profile" },
  { href: "/patient/visits", label: "Visits" },
  { href: "/patient/diagnoses", label: "Diagnoses" },
  { href: "/patient/prescriptions", label: "Prescriptions" },
];

const SOON = ["Orders", "Assessment"];

/**
 * Wraps patient-portal pages: guards the route (redirects to /login when there
 * is no session) and renders the patient header + navigation. Thin — no
 * business logic. Distinct from the clinic `AppShell` (no org switcher).
 */
export function PatientShell({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  }
  if (!session) {
    return (
      <div className="p-8 text-sm text-zinc-500">Redirecting to login…</div>
    );
  }

  const isActive = (href: string) =>
    href === "/patient" ? pathname === "/patient" : pathname.startsWith(href);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/patient" className="font-semibold text-zinc-900">
            Xerbs
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "font-medium text-zinc-900"
                    : "text-zinc-600 hover:underline"
                }
              >
                {item.label}
              </Link>
            ))}
            {SOON.map((label) => (
              <span
                key={label}
                className="cursor-not-allowed text-zinc-300"
                title="Coming soon"
                aria-disabled="true"
              >
                {label} <span className="text-[10px]">(soon)</span>
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-600">
          <span>{session.user.email}</span>
          <button
            type="button"
            className="rounded border border-zinc-300 px-2 py-1 hover:bg-zinc-100"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
