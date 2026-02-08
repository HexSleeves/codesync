/**
 * Database client using Drizzle ORM with PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config';
import * as schema from './schema';

// Create postgres.js client with connection pool config
const client = postgres(config.databaseUrl, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
