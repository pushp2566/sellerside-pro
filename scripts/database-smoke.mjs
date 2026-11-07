import { existsSync } from 'node:fs';
import pg from 'pg';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing from the private .env.local file.');
  process.exit(1);
}

const connection = new URL(process.env.DATABASE_URL);
if (!['postgres:', 'postgresql:'].includes(connection.protocol)) throw new Error('Invalid database connection protocol');
// Verify the server certificate rather than relaxing TLS for the probe.
connection.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: connection.toString(), connectionTimeoutMillis: 15000, query_timeout: 15000 });
try {
  await client.connect();
  const info = await client.query('SELECT current_database() AS name, current_setting(\'server_version\') AS version');
  if (info.rows[0].name !== 'sellerside') throw new Error('Connected to an unexpected database');
  await client.query('BEGIN');
  await client.query('CREATE TEMP TABLE sellerside_connection_probe (id integer PRIMARY KEY, amount_cents integer NOT NULL CHECK (amount_cents >= 0)) ON COMMIT DROP');
  await client.query('INSERT INTO sellerside_connection_probe (id, amount_cents) VALUES ($1, $2)', [1, 6000]);
  const read = await client.query('SELECT amount_cents FROM sellerside_connection_probe WHERE id = $1', [1]);
  if (read.rows[0]?.amount_cents !== 6000) throw new Error('Database read-back did not match the test write');
  await client.query('ROLLBACK');
  console.log('PASS: encrypted connection to sellerside.');
  console.log('PASS: parameterized test write and read matched (6000 cents).');
  console.log('PASS: transaction rolled back; no permanent test data created.');
  console.log('PostgreSQL version:', info.rows[0].version);
} catch (error) {
  // Avoid printing connection strings or database credentials.
  const safe = { code: error.code || error.name || 'UNKNOWN' };
  console.error('Database probe failed:', JSON.stringify(safe));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
