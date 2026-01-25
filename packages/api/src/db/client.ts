/**
 * Database client using Drizzle ORM with PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config';
import * as schema from './schema';

// Create postgres.js client
const client = postgres(config.databaseUrl);

// Create drizzle database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
