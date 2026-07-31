import { config } from "dotenv";

// Load local dev secrets BEFORE importing the db client. The db client and
// schema are imported dynamically inside main() so this runs first — a static
// `import` is hoisted above this call and would read DATABASE_URL too early.
config({ path: ".env.local" });

/**
 * Seeds a demo organization and a demo provider (a user + their membership).
 * Idempotent: re-running upserts on the unique slug / email rather than
 * creating duplicates.
 */
async function main() {
  const { db } = await import("./index");
  const { organizationMembers, organizations, user } = await import(
    "./schema"
  );

  console.log("Seeding demo organization and provider…");

  const [org] = await db
    .insert(organizations)
    .values({ name: "Xerbs Demo Clinic", slug: "xerbs-demo-clinic" })
    .onConflictDoUpdate({
      target: organizations.slug,
      set: { name: "Xerbs Demo Clinic" },
    })
    .returning();

  const [demoUser] = await db
    .insert(user)
    .values({
      // Deterministic id so re-seeding is stable (Better Auth would generate
      // this in real signups).
      id: "demo-provider",
      name: "Dr. Demo Practitioner",
      email: "demo.provider@xerbs.example",
      emailVerified: true,
    })
    .onConflictDoUpdate({
      target: user.email,
      set: { name: "Dr. Demo Practitioner", emailVerified: true },
    })
    .returning();

  const [member] = await db
    .insert(organizationMembers)
    .values({
      organizationId: org.id,
      userId: demoUser.id,
      role: "owner",
      title: "L.Ac.",
    })
    .onConflictDoUpdate({
      target: [organizationMembers.organizationId, organizationMembers.userId],
      set: { role: "owner", title: "L.Ac." },
    })
    .returning();

  console.log("  organization:", { id: org.id, slug: org.slug });
  console.log("  user:        ", { id: demoUser.id, email: demoUser.email });
  console.log("  membership:  ", { id: member.id, role: member.role });
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
