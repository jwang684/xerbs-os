"use client";

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth-client";

/**
 * Minimal organization switcher. Lists the user's organizations and switches the
 * session's active organization (which re-scopes every API call). Reloads so
 * client-side data refetches for the new organization.
 */
export function OrgSwitcher() {
  const { data: organizations } = useListOrganizations();
  const { data: active } = useActiveOrganization();

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <select
      aria-label="Active organization"
      className="rounded border border-zinc-300 px-2 py-1 text-sm"
      value={active?.id ?? ""}
      onChange={async (e) => {
        await organization.setActive({ organizationId: e.target.value });
        window.location.reload();
      }}
    >
      {organizations.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
