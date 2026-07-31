import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { closeDb, db } from "@/db";
import { organizationMembers, organizations, user } from "@/db/schema";

import { ForbiddenError, UnauthorizedError } from "../http/errors";

// Mock the Better Auth instance so we control the resolved session without
// standing up the full auth stack. The membership lookup uses the real DB.
const getSessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSessionMock(...args) } },
}));

const { getAuthContext } = await import("./context");

let orgA: string;
let orgB: string;
let userId: string;

const req = () => new Request("http://localhost/api/patients");

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Ctx Org A", slug: `ctx-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Ctx Org B", slug: `ctx-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  userId = `ctx-user-${randomUUID()}`;
  await db.insert(user).values({
    id: userId,
    name: "Ctx User",
    email: `${userId}@example.com`,
    emailVerified: true,
  });
  // Member of org A only.
  await db.insert(organizationMembers).values({
    organizationId: orgA,
    userId,
    role: "practitioner",
  });
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(eq(user.id, userId));
  await closeDb();
});

describe("getAuthContext", () => {
  it("401s without a session", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    await expect(getAuthContext(req())).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("403s when the session has no active organization", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: userId },
      session: { activeOrganizationId: null },
    });
    await expect(getAuthContext(req())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("resolves the organization and role from the session", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: userId },
      session: { activeOrganizationId: orgA },
    });
    const ctx = await getAuthContext(req());
    expect(ctx.userId).toBe(userId);
    expect(ctx.organizationId).toBe(orgA);
    expect(ctx.role).toBe("practitioner");
    expect(ctx.membershipId).toBeTruthy();
  });

  it("403s when the active organization is one the user does not belong to", async () => {
    // Session claims org B, but the user is only a member of org A.
    getSessionMock.mockResolvedValueOnce({
      user: { id: userId },
      session: { activeOrganizationId: orgB },
    });
    await expect(getAuthContext(req())).rejects.toBeInstanceOf(ForbiddenError);
  });
});
