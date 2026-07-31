"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";

// Entry point: send authenticated users to the patient list, others to login.
export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    router.replace(session ? "/patients" : "/login");
  }, [isPending, session, router]);

  return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
}
