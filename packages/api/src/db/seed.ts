/**
 * Database seed script for local development.
 * Run with: bun src/db/seed.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import { config } from '../config';
import { users } from './schema';

type SeedUser = {
  email: string;
  name: string;
  password: string;
};

const seedUsers: SeedUser[] = [
  {
    email: 'alice@codesync.local',
    name: 'Alice Reviewer',
    password: 'password123',
  },
  {
    email: 'bob@codesync.local',
    name: 'Bob Developer',
    password: 'password123',
  },
  {
    email: 'carol@codesync.local',
    name: 'Carol Maintainer',
    password: 'password123',
  },
];

async function seedUsersTable(): Promise<void> {
  const sql = postgres(config.databaseUrl, { max: 1 });
  const db = drizzle(sql);
  const passwordOverride = process.env.SEED_USER_PASSWORD;

  try {
    console.log('🌱 Seeding users...');

    for (const user of seedUsers) {
      const plainPassword = passwordOverride || user.password;
      const passwordHash = await Bun.password.hash(plainPassword, { algorithm: 'argon2id' });

      await db
        .insert(users)
        .values({
          id: nanoid(),
          email: user.email,
          name: user.name,
          passwordHash,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: user.name,
            passwordHash,
          },
        });
    }

    console.log(`✅ Seeded ${seedUsers.length} users`);
    console.log('   Accounts:');
    for (const user of seedUsers) {
      console.log(`   - ${user.email}`);
    }
    console.log(
      `   Password: ${passwordOverride ? '(from SEED_USER_PASSWORD)' : seedUsers[0].password}`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

seedUsersTable().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
