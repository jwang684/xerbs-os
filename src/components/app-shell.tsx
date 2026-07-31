"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { signOut, useSession } from "@/lib/auth-client";

import { OrgSwitcher } from "./org-switcher";

/**
 * Wraps authenticated pages: guards the route (redirects to /login when there is
 * no session) and renders the header + navigation. Thin — no business logic.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  }
  if (!session) {
    return <div className="p-8 text-sm text-zinc-500">Redirecting to login…</div>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <Link href="/patients" className="font-semibold text-zinc-900">
          Xerbs OS
        </Link>
        <div className="flex items-center gap-4 text-sm text-zinc-600">
          <OrgSwitcher />
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
      <main className="mx-auto w-full max-w-3xl flex-1 p-6">{children}</main>
    </div>
  );
}
