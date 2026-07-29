import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Blend Administrator";

  if (!connectionString || !email || !password) {
    throw new Error("Database URL, administrator email, and password are required");
  }

  if (password.length < 8) {
    throw new Error("Administrator password must contain at least 8 characters");
  }

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });
  const passwordHash = await hashPassword(password);

  try {
    await db.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        role: "ADMIN",
        active: true,
      },
      create: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        active: true,
      },
    });
  } finally {
    await db.$disconnect();
  }

  console.log("Administrator account is ready");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Provisioning failed");
  process.exit(1);
});
