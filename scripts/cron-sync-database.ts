#!/usr/bin/env node
/**
 * Standalone Database Synchronization Cron Script
 * ------------------------------------------------
 * Replicates active data from Primary (Oracle Cloud VM PostgreSQL) to Standby (Neon Serverless PostgreSQL).
 * 
 * Usage:
 *   npx tsx scripts/cron-sync-database.ts
 *   or:
 *   npm run db:cron-sync
 * 
 * Recommended System Crontab (e.g. Daily at 02:00 AM IST / 20:30 UTC):
 *   30 20 * * * cd /home/ubuntu/website && /usr/bin/npm run db:cron-sync >> /var/log/db-cron-sync.log 2>&1
 */

import 'dotenv/config';
import { executeDatabaseSync } from '../src/services/databaseSyncService.js';

async function runCronSync() {
  const runId = `cron_${Date.now()}`;
  const startTime = new Date();
  console.log(`[Cron Database Sync] [${startTime.toISOString()}] Starting scheduled database sync sequence (${runId})...`);

  try {
    const result = await executeDatabaseSync({
      trigger: 'CRON_JOB',
      initiatedBy: process.env.CRON_IDENTIFIER || 'Standalone CLI Crontab'
    });

    console.log(`[Cron Database Sync] SUCCESS: ${result.message}`);
    console.log(`[Cron Database Sync] Parity stats:`, JSON.stringify(result.syncedCounts, null, 2));
    console.log(`[Cron Database Sync] Completed in ${result.durationMs}ms.`);
    process.exit(0);
  } catch (error: any) {
    console.error(`[Cron Database Sync] FAILED:`, error.message || error);
    process.exit(1);
  }
}

runCronSync();
