import { neon } from '@neondatabase/serverless';

export const databaseUrl = process.env.DATABASE_URL || '';
export const sql = databaseUrl ? neon(databaseUrl) : null;

export async function getDbHealth() {
  if (!sql) {
    return {
      configured: false,
      mode: 'local-file-storage',
      status: 'not-configured',
      message: 'Set DATABASE_URL in Vercel environment variables to enable Neon serverless storage.',
    };
  }

  try {
    const result = await sql`SELECT 1 as ok, current_database() as database_name, current_user as username`;
    return {
      configured: true,
      mode: 'neon-serverless',
      status: 'healthy',
      row: result[0] ?? null,
    };
  } catch (error) {
    return {
      configured: true,
      mode: 'neon-serverless',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Neon connection error.',
    };
  }
}
