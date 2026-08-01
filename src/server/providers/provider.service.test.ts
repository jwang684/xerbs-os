import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDb, db } from "@/db";
import {
  organizationMembers,
  organizations,
  type ProviderProfile,
  user,
} from "@/db/schema";

import type { AuthContext } from "../auth/authz";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../http/errors";
import { providerRepository } from "./provider.repository";
import { providerService } from "./provider.service";

let orgA: string;
let orgB: string;
const uid = { owner: "", practitioner: "", staff: "", memberX: "", nonMember: "" };

const ctx = (
  organizationId: string,
  role: AuthContext["role"],
  userId: string,
): AuthContext => ({
  userId,
  organizationId,
  membershipId: `m-${role}`,
  role,
});

let ctxOwner: AuthContext;
let ctxPractitioner: AuthContext;
let ctxStaff: AuthContext;
let ctxB: AuthContext;

async function makeUser(label: string): Promise<string> {
  const id = `prov-${label}-${randomUUID()}`;
  await db.insert(user).values({
    id,
    name: label,
    email: `${id}@example.com`,
    emailVerified: true,
  });
  return id;
}

async function profileFor(userId: string): Promise<ProviderProfile> {
  const p = await providerRepository.findByUser(orgA, userId);
  if (!p) throw new Error(`no profile for ${userId}`);
  return p;
}

beforeAll(async () => {
  const [a] = await db
    .insert(organizations)
    .values({ name: "Prov Org A", slug: `prov-a-${randomUUID()}` })
    .returning();
  const [b] = await db
    .insert(organizations)
    .values({ name: "Prov Org B", slug: `prov-b-${randomUUID()}` })
    .returning();
  orgA = a.id;
  orgB = b.id;

  uid.owner = await makeUser("owner");
  uid.practitioner = await makeUser("practitioner");
  uid.staff = await makeUser("staff");
  uid.memberX = await makeUser("memberx");
  uid.nonMember = await makeUser("nonmember"); // exists but not a member of orgA

  await db.insert(organizationMembers).values([
    { organizationId: orgA, userId: uid.owner, role: "owner" },
    { organizationId: orgA, userId: uid.practitioner, role: "practitioner" },
    { organizationId: orgA, userId: uid.staff, role: "staff" },
    { organizationId: orgA, userId: uid.memberX, role: "practitioner" },
  ]);

  ctxOwner = ctx(orgA, "owner", uid.owner);
  ctxPractitioner = ctx(orgA, "practitioner", uid.practitioner);
  ctxStaff = ctx(orgA, "staff", uid.staff);
  ctxB = ctx(orgB, "owner", "someone");
});

afterAll(async () => {
  await db.delete(organizations).where(inArray(organizations.id, [orgA, orgB]));
  await db.delete(user).where(inArray(user.id, Object.values(uid)));
  await closeDb();
});

describe("providerService — create", () => {
  it("owner creates a profile for a member", async () => {
    const p = await providerService.create(ctxOwner, {
      userId: uid.practitioner,
      title: "L.Ac.",
      specialty: "Acupuncture",
      npi: "1234567890",
    });
    expect(p.organizationId).toBe(orgA);
    expect(p.userId).toBe(uid.practitioner);
    expect(p.isActive).toBe(true);
  });

  it("enforces one profile per member", async () => {
    await expect(
      providerService.create(ctxOwner, { userId: uid.practitioner }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a userId that is not a member of the org", async () => {
    await expect(
      providerService.create(ctxOwner, { userId: uid.nonMember }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it("forbids non-owner/admin from creating", async () => {
    await expect(
      providerService.create(ctxPractitioner, { userId: uid.staff }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      providerService.create(ctxStaff, { userId: uid.memberX }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("validates input", async () => {
    await expect(
      providerService.create(ctxOwner, { userId: uid.memberX, npi: "12" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      providerService.create(ctxOwner, {
        userId: uid.memberX,
        avatarUrl: "not-a-url",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("providerService — read/list", () => {
  it("staff can read and list", async () => {
    const list = await providerService.list(ctxStaff, {});
    expect(list.items.length).toBeGreaterThanOrEqual(1);
    const read = await providerService.get(ctxStaff, list.items[0].id);
    expect(read.id).toBe(list.items[0].id);
  });

  it("filters by isActive", async () => {
    const list = await providerService.list(ctxOwner, { isActive: "true" });
    expect(list.items.every((p) => p.isActive)).toBe(true);
  });
});

describe("providerService — update authorization", () => {
  it("owner updates any profile", async () => {
    const target = await profileFor(uid.practitioner);
    const updated = await providerService.update(ctxOwner, target.id, {
      bio: "Updated by owner",
    });
    expect(updated.bio).toBe("Updated by owner");
  });

  it("practitioner updates only their own profile", async () => {
    const own = await profileFor(uid.practitioner);
    const ok = await providerService.update(ctxPractitioner, own.id, {
      specialty: "Herbal Medicine",
    });
    expect(ok.specialty).toBe("Herbal Medicine");

    // A profile belonging to another member — practitioner may not edit it.
    const other = await providerService.create(ctxOwner, {
      userId: uid.memberX,
    });
    await expect(
      providerService.update(ctxPractitioner, other.id, { bio: "nope" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("staff cannot update", async () => {
    const target = await profileFor(uid.practitioner);
    await expect(
      providerService.update(ctxStaff, target.id, { bio: "nope" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("providerService — organization isolation", () => {
  it("does not leak profiles across organizations", async () => {
    const inA = await profileFor(uid.practitioner);
    await expect(providerService.get(ctxB, inA.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      providerService.update(ctxB, inA.id, { bio: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const listB = await providerService.list(ctxB, {});
    expect(listB.items.some((p) => p.id === inA.id)).toBe(false);
  });
});
