/**
 * Database client using Drizzle ORM with PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://codesync:codesync@localhost:5432/codesync';

// Create postgres.js client
const client = postgres(connectionString);

// Create drizzle database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
