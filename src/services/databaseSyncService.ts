import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import { neonConfig } from '@neondatabase/serverless';
import pg from 'pg';
import ws from 'ws';
import { getPrismaClient } from '../../api/_utils.js';

let cachedBackupClient: PrismaClient | null = null;
let lastSyncTimestamp: string | null = null;
let lastSyncStats: Record<string, number> | null = null;

export interface DatabaseSyncHistoryEntry {
  id: string;
  timestamp: string;
  trigger: 'CRON_JOB' | 'MANUAL_ADMIN';
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  totalRecordsSynced: number;
  syncedCounts: Record<string, number>;
  sourceDatabase: string;
  targetDatabase: string;
  errorMessage?: string;
  initiatedBy?: string;
}

const HISTORY_FILE = path.join(process.cwd(), 'data', 'database_sync_history.json');

const TMP_HISTORY_FILE = path.join('/tmp', 'database_sync_history.json');

// In-memory sync history cache to preserve manual/cron entries within the runtime
let inMemoryHistory: DatabaseSyncHistoryEntry[] = [];

// Seed in-memory cache from disk if available
try {
  if (fs.existsSync(HISTORY_FILE)) {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) inMemoryHistory = parsed;
  }
} catch (e) {
  // Ignore initial read error
}

/**
 * Persists sync history record in the primary PostgreSQL database so it survives
 * serverless function restarts, container redeploys, and ephemeral filesystems.
 */
export async function persistSyncHistoryInDb(entry: DatabaseSyncHistoryEntry): Promise<void> {
  try {
    const primary = getPrismaClient();
    await primary.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_database_sync_history" (
        "id" TEXT PRIMARY KEY,
        "timestamp" TEXT NOT NULL,
        "trigger" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "durationMs" INT NOT NULL,
        "totalRecordsSynced" INT NOT NULL,
        "syncedCounts" JSONB,
        "sourceDatabase" TEXT,
        "targetDatabase" TEXT,
        "errorMessage" TEXT,
        "initiatedBy" TEXT
      );
    `);

    await primary.$executeRawUnsafe(`
      INSERT INTO "_database_sync_history" 
      ("id", "timestamp", "trigger", "status", "durationMs", "totalRecordsSynced", "syncedCounts", "sourceDatabase", "targetDatabase", "errorMessage", "initiatedBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
      ON CONFLICT ("id") DO NOTHING;
    `,
      entry.id,
      entry.timestamp,
      entry.trigger,
      entry.status,
      entry.durationMs,
      entry.totalRecordsSynced,
      JSON.stringify(entry.syncedCounts || {}),
      entry.sourceDatabase,
      entry.targetDatabase,
      entry.errorMessage || null,
      entry.initiatedBy || null
    );
  } catch (err: any) {
    console.error("[DatabaseSyncService] DB sync history persistence warning:", err.message);
  }
}

/**
 * Loads recorded sync history entries directly from PostgreSQL database table.
 */
export async function loadSyncHistoryFromDb(): Promise<DatabaseSyncHistoryEntry[]> {
  try {
    const primary = getPrismaClient();
    const rows = await primary.$queryRawUnsafe<any[]>(`
      SELECT * FROM "_database_sync_history" ORDER BY "timestamp" DESC LIMIT 100;
    `);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        trigger: r.trigger,
        status: r.status,
        durationMs: Number(r.durationMs || r.duration_ms || 0),
        totalRecordsSynced: Number(r.totalRecordsSynced || r.total_records_synced || 0),
        syncedCounts: typeof r.syncedCounts === 'string' ? JSON.parse(r.syncedCounts) : (r.syncedCounts || {}),
        sourceDatabase: r.sourceDatabase || r.source_database || '',
        targetDatabase: r.targetDatabase || r.target_database || '',
        errorMessage: r.errorMessage || r.error_message || undefined,
        initiatedBy: r.initiatedBy || r.initiated_by || undefined
      }));
    }
  } catch (e: any) {
    // Table not created yet or query failed - fallback gracefully
  }
  return [];
}

/**
 * Combines history from database, memory, and filesystem with automatic deduplication.
 */
export async function loadSyncHistory(): Promise<DatabaseSyncHistoryEntry[]> {
  const map = new Map<string, DatabaseSyncHistoryEntry>();

  // 1. Load from DB
  const dbEntries = await loadSyncHistoryFromDb();
  for (const entry of dbEntries) {
    map.set(entry.id, entry);
  }

  // 2. Load from In-Memory
  for (const entry of inMemoryHistory) {
    if (!map.has(entry.id)) {
      map.set(entry.id, entry);
    }
  }

  // 3. Load from data/ file
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (!map.has(entry.id)) map.set(entry.id, entry);
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // 4. Load from /tmp file (Vercel serverless fallback)
  try {
    if (fs.existsSync(TMP_HISTORY_FILE)) {
      const raw = fs.readFileSync(TMP_HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (!map.has(entry.id)) map.set(entry.id, entry);
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const combined = Array.from(map.values());
  combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return combined;
}

export async function saveSyncHistoryEntry(entry: DatabaseSyncHistoryEntry): Promise<void> {
  // 1. Update in-memory cache immediately
  inMemoryHistory.unshift(entry);
  inMemoryHistory = inMemoryHistory.slice(0, 100);

  // 2. Persist to PostgreSQL database
  await persistSyncHistoryInDb(entry);

  // 3. Persist to data/ file if writable
  try {
    const dataDir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const combined = await loadSyncHistory();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(combined.slice(0, 100), null, 2), 'utf-8');
  } catch (e) {
    // 4. Fallback to /tmp if filesystem is read-only (Vercel environment)
    try {
      const combined = await loadSyncHistory();
      fs.writeFileSync(TMP_HISTORY_FILE, JSON.stringify(combined.slice(0, 100), null, 2), 'utf-8');
    } catch (tmpErr) {
      console.error("[DatabaseSyncService] Failed to persist sync history to tmp:", tmpErr);
    }
  }
}

export async function getSyncHistorySummary(limit: number = 20) {
  const all = await loadSyncHistory();
  const recent = all.slice(0, limit);
  const totalRuns = all.length;
  const successfulRuns = all.filter(e => e.status === 'SUCCESS').length;
  const failedRuns = all.filter(e => e.status === 'FAILED').length;
  const lastCron = all.find(e => e.trigger === 'CRON_JOB');
  const lastManual = all.find(e => e.trigger === 'MANUAL_ADMIN');

  return {
    history: recent,
    totalRuns,
    successfulRuns,
    failedRuns,
    lastCronTimestamp: lastCron ? lastCron.timestamp : null,
    lastManualTimestamp: lastManual ? lastManual.timestamp : null
  };
}

export function getBackupPrismaClient(): PrismaClient | null {
  if (cachedBackupClient) return cachedBackupClient;
  const dbUrl = process.env["BACKUP_DATABASE_URL"] || "";
  if (!dbUrl) return null;

  try {
    if (dbUrl.includes("neon.tech")) {
      neonConfig.webSocketConstructor = ws;
      const adapter = new PrismaNeon({ connectionString: dbUrl });
      cachedBackupClient = new PrismaClient({ adapter });
      return cachedBackupClient;
    }

    if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
      const pool = new pg.Pool({ connectionString: dbUrl });
      const adapter = new PrismaPg(pool);
      cachedBackupClient = new PrismaClient({ adapter });
      return cachedBackupClient;
    }

    const pool = new pg.Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    cachedBackupClient = new PrismaClient({ adapter });
    return cachedBackupClient;
  } catch (err) {
    console.error("[DatabaseSyncService] Failed to initialize backup client:", err);
    return null;
  }
}

export function parseDatabaseMetadata(url?: string, role: 'primary' | 'backup' = 'primary') {
  if (!url) {
    return {
      role,
      provider: 'Unconfigured',
      host: 'Not configured',
      port: 0,
      database: 'none',
      user: 'none',
      adapter: 'none'
    };
  }

  try {
    const isNeon = url.includes("neon.tech");
    const isPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");
    const parsed = new URL(url);

    let provider = 'PostgreSQL';
    if (isNeon) {
      provider = 'Neon Serverless Cloud (AWS Singapore)';
    } else if (parsed.hostname.startsWith('137.23') || parsed.hostname.includes('oracle')) {
      provider = 'Oracle Cloud Always Free VM (PostgreSQL)';
    }

    return {
      role,
      provider,
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'default',
      user: parsed.username ? `${parsed.username.slice(0, 3)}***` : 'default',
      adapter: isNeon ? '@prisma/adapter-neon (WebSocket)' : '@prisma/adapter-pg (TCP Pool)'
    };
  } catch (e) {
    return {
      role,
      provider: 'Custom Database Connection',
      host: 'Configured via URI',
      port: 5432,
      database: 'production',
      user: 'authenticated',
      adapter: '@prisma/adapter-pg'
    };
  }
}

export async function getDatabaseStatus() {
  const primaryPrisma = getPrismaClient();
  const backupPrisma = getBackupPrismaClient();

  const primaryUrl = process.env["DATABASE_URL"] || "";
  const backupUrl = process.env["BACKUP_DATABASE_URL"] || "";

  const primaryMeta = parseDatabaseMetadata(primaryUrl, 'primary');
  const backupMeta = parseDatabaseMetadata(backupUrl, 'backup');

  let primaryStatus = 'OFFLINE';
  let primaryLatencyMs = -1;
  let primaryStats: Record<string, number> = {};

  try {
    const start = Date.now();
    const [
      userCount, 
      portfolioCount, 
      simCount, 
      invoiceCount, 
      nodeCount, 
      docCount, 
      bugCount, 
      inquiryCount, 
      pluginCount, 
      tradeCount
    ] = await Promise.all([
      primaryPrisma.user.count(),
      primaryPrisma.portfolio.count(),
      primaryPrisma.simulationStore.count(),
      primaryPrisma.invoice.count(),
      primaryPrisma.flowNode.count(),
      primaryPrisma.document.count(),
      primaryPrisma.bugReport.count(),
      primaryPrisma.contactInquiry.count(),
      primaryPrisma.workspacePlugin.count(),
      primaryPrisma.trade.count()
    ]);
    primaryLatencyMs = Date.now() - start;
    primaryStatus = 'ONLINE';
    primaryStats = {
      users: userCount,
      portfolios: portfolioCount,
      simulations: simCount,
      invoices: invoiceCount,
      flowNodes: nodeCount,
      documents: docCount,
      bugReports: bugCount,
      contactInquiries: inquiryCount,
      plugins: pluginCount,
      trades: tradeCount
    };
  } catch (err: any) {
    primaryStatus = 'ERROR';
    console.error("[DatabaseSyncService] Primary health check error:", err.message);
  }

  let backupStatus = 'UNCONFIGURED';
  let backupLatencyMs = -1;
  let backupStats: Record<string, number> = {};

  if (backupPrisma) {
    try {
      const start = Date.now();
      const [
        userCount, 
        portfolioCount, 
        simCount, 
        invoiceCount, 
        nodeCount, 
        docCount, 
        bugCount, 
        inquiryCount, 
        pluginCount, 
        tradeCount
      ] = await Promise.all([
        backupPrisma.user.count(),
        backupPrisma.portfolio.count(),
        backupPrisma.simulationStore.count(),
        backupPrisma.invoice.count(),
        backupPrisma.flowNode.count(),
        backupPrisma.document.count(),
        backupPrisma.bugReport.count(),
        backupPrisma.contactInquiry.count(),
        backupPrisma.workspacePlugin.count(),
        backupPrisma.trade.count()
      ]);
      backupLatencyMs = Date.now() - start;
      backupStatus = 'ONLINE';
      backupStats = {
        users: userCount,
        portfolios: portfolioCount,
        simulations: simCount,
        invoices: invoiceCount,
        flowNodes: nodeCount,
        documents: docCount,
        bugReports: bugCount,
        contactInquiries: inquiryCount,
        plugins: pluginCount,
        trades: tradeCount
      };
    } catch (err: any) {
      backupStatus = 'OFFLINE';
      console.error("[DatabaseSyncService] Backup health check error:", err.message);
    }
  }

  // Compute sync parity
  const tableDiffs: Record<string, { primary: number; backup: number; inSync: boolean }> = {};
  let overallInSync = true;

  if (primaryStatus === 'ONLINE' && backupStatus === 'ONLINE') {
    for (const key of Object.keys(primaryStats)) {
      const p = primaryStats[key] || 0;
      const b = backupStats[key] || 0;
      const inSync = p === b;
      if (!inSync) overallInSync = false;
      tableDiffs[key] = { primary: p, backup: b, inSync };
    }
  } else {
    overallInSync = false;
  }

  return {
    primary: {
      ...primaryMeta,
      status: primaryStatus,
      latencyMs: primaryLatencyMs,
      stats: primaryStats
    },
    backup: {
      ...backupMeta,
      status: backupStatus,
      latencyMs: backupLatencyMs,
      stats: backupStats
    },
    tableDiffs,
    overallInSync,
    lastSyncTimestamp,
    lastSyncStats,
    syncHistorySummary: await getSyncHistorySummary(20)
  };
}

export async function executeDatabaseSync(options?: { trigger?: 'CRON_JOB' | 'MANUAL_ADMIN'; initiatedBy?: string }) {
  const trigger = options?.trigger || 'MANUAL_ADMIN';
  const initiatedBy = options?.initiatedBy || (trigger === 'CRON_JOB' ? 'System Cron Scheduler' : 'Admin User');
  const primary = getPrismaClient();
  const backup = getBackupPrismaClient();

  const startTime = Date.now();
  const syncedCounts: Record<string, number> = {};

  if (!backup) {
    const errorMsg = "Backup database is not configured in BACKUP_DATABASE_URL";
    const failedEntry: DatabaseSyncHistoryEntry = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      trigger,
      status: 'FAILED',
      durationMs: 0,
      totalRecordsSynced: 0,
      syncedCounts: {},
      sourceDatabase: 'Oracle Cloud Always Free VM (PostgreSQL)',
      targetDatabase: 'Neon Serverless PostgreSQL',
      errorMessage: errorMsg,
      initiatedBy
    };
    await saveSyncHistoryEntry(failedEntry);
    throw new Error(errorMsg);
  }

  try {
    // 1. Sync WorkspacePlugin definitions first (dependency for UserWorkspacePlugin)
    const plugins = await primary.workspacePlugin.findMany();
    for (const item of plugins) {
      await backup.workspacePlugin.upsert({
        where: { id: item.id },
        create: item,
        update: item
      });
    }
    syncedCounts['workspacePlugins'] = plugins.length;

    // 1b. Sync WorkspacePluginVersion
    const pluginVersions = await primary.workspacePluginVersion.findMany();
    for (const item of pluginVersions) {
      await backup.workspacePluginVersion.upsert({
        where: { id: item.id },
        create: item,
        update: item
      });
    }
    syncedCounts['workspacePluginVersions'] = pluginVersions.length;

    // 2. Sync Storefront Plugins
    const storePlugins = await primary.plugin.findMany();
    for (const item of storePlugins) {
      await backup.plugin.upsert({
        where: { id: item.id },
        create: item,
        update: item
      });
    }
    syncedCounts['plugins'] = storePlugins.length;

    // 3. Sync Users
    const users = await primary.user.findMany();
    for (const u of users) {
      await backup.user.upsert({
        where: { email: u.email },
        create: u,
        update: u
      });
    }
    syncedCounts['users'] = users.length;

    // 4. Sync Portfolios
    const portfolios = await primary.portfolio.findMany();
    for (const p of portfolios) {
      await backup.portfolio.upsert({
        where: { userEmail: p.userEmail },
        create: p,
        update: p
      });
    }
    syncedCounts['portfolios'] = portfolios.length;

    // 5. Sync UserWorkspacePlugin
    const userPlugins = await primary.userWorkspacePlugin.findMany();
    for (const up of userPlugins) {
      await backup.userWorkspacePlugin.upsert({
        where: { userEmail_pluginId: { userEmail: up.userEmail, pluginId: up.pluginId } },
        create: up,
        update: up
      });
    }
    syncedCounts['userWorkspacePlugins'] = userPlugins.length;

    // 6. Sync WorkspacePluginReview
    const reviews = await primary.workspacePluginReview.findMany();
    for (const r of reviews) {
      await backup.workspacePluginReview.upsert({
        where: { userEmail_pluginId: { userEmail: r.userEmail, pluginId: r.pluginId } },
        create: r,
        update: r
      });
    }
    syncedCounts['pluginReviews'] = reviews.length;

    // 7. Sync AccountingTenantStore
    const accountingStores = await primary.accountingTenantStore.findMany();
    for (const acc of accountingStores) {
      await backup.accountingTenantStore.upsert({
        where: { userEmail: acc.userEmail },
        create: acc,
        update: acc
      });
    }
    syncedCounts['accountingStores'] = accountingStores.length;

    // 8. Sync Invoices
    const invoices = await primary.invoice.findMany();
    for (const inv of invoices) {
      await backup.invoice.upsert({
        where: { id: inv.id },
        create: inv,
        update: inv
      });
    }
    syncedCounts['invoices'] = invoices.length;

    // 9. Sync FlowNodes
    const flowNodes = await primary.flowNode.findMany();
    for (const node of flowNodes) {
      await backup.flowNode.upsert({
        where: { id: node.id },
        create: node,
        update: node
      });
    }
    syncedCounts['flowNodes'] = flowNodes.length;

    // 10. Sync Trades
    const trades = await primary.trade.findMany();
    for (const tr of trades) {
      await backup.trade.upsert({
        where: { id: tr.id },
        create: tr,
        update: tr
      });
    }
    syncedCounts['trades'] = trades.length;

    // 11. Sync Documents
    const docs = await primary.document.findMany();
    for (const doc of docs) {
      await backup.document.upsert({
        where: { id: doc.id },
        create: doc,
        update: doc
      });
    }
    syncedCounts['documents'] = docs.length;

    // 12. Sync DevelopmentProject
    const projects = await primary.developmentProject.findMany();
    for (const proj of projects) {
      await backup.developmentProject.upsert({
        where: { id: proj.id },
        create: proj,
        update: proj
      });
    }
    syncedCounts['developmentProjects'] = projects.length;

    // 13. Sync ContactInquiry
    const inquiries = await primary.contactInquiry.findMany();
    for (const inq of inquiries) {
      await backup.contactInquiry.upsert({
        where: { id: inq.id },
        create: inq,
        update: inq
      });
    }
    syncedCounts['contactInquiries'] = inquiries.length;

    // 14. Sync SimulationStore
    const simulations = await primary.simulationStore.findMany();
    for (const sim of simulations) {
      await backup.simulationStore.upsert({
        where: { simId: sim.simId },
        create: sim,
        update: sim
      });
    }
    syncedCounts['simulations'] = simulations.length;

    // 15. Sync BugReports
    const bugReports = await primary.bugReport.findMany();
    for (const bug of bugReports) {
      await backup.bugReport.upsert({
        where: { id: bug.id },
        create: bug,
        update: bug
      });
    }
    syncedCounts['bugReports'] = bugReports.length;

    const durationMs = Date.now() - startTime;
    lastSyncTimestamp = new Date().toISOString();
    lastSyncStats = syncedCounts;

    const totalRecords = Object.values(syncedCounts).reduce((acc, curr) => acc + curr, 0);

    const historyEntry: DatabaseSyncHistoryEntry = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: lastSyncTimestamp,
      trigger,
      status: 'SUCCESS',
      durationMs,
      totalRecordsSynced: totalRecords,
      syncedCounts,
      sourceDatabase: 'Oracle Cloud Always Free VM (PostgreSQL)',
      targetDatabase: 'Neon Serverless PostgreSQL',
      initiatedBy
    };
    await saveSyncHistoryEntry(historyEntry);

    return {
      success: true,
      message: `Database synchronization complete. ${totalRecords} records synced to Neon backup across ${Object.keys(syncedCounts).length} tables in ${durationMs}ms.`,
      durationMs,
      syncedCounts,
      timestamp: lastSyncTimestamp,
      trigger,
      historyEntry
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const historyEntry: DatabaseSyncHistoryEntry = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      trigger,
      status: 'FAILED',
      durationMs,
      totalRecordsSynced: Object.values(syncedCounts).reduce((acc, curr) => acc + curr, 0),
      syncedCounts,
      sourceDatabase: 'Oracle Cloud Always Free VM (PostgreSQL)',
      targetDatabase: 'Neon Serverless PostgreSQL',
      errorMessage: err.message || String(err),
      initiatedBy
    };
    await saveSyncHistoryEntry(historyEntry);
    throw err;
  }
}

export async function exportDatabaseDump() {
  const primary = getPrismaClient();

  const [
    users,
    portfolios,
    trades,
    flowNodes,
    invoices,
    documents,
    developmentProjects,
    contactInquiries,
    simulationStores,
    accountingStores,
    bugReports,
    workspacePlugins,
    plugins
  ] = await Promise.all([
    primary.user.findMany(),
    primary.portfolio.findMany(),
    primary.trade.findMany(),
    primary.flowNode.findMany(),
    primary.invoice.findMany(),
    primary.document.findMany(),
    primary.developmentProject.findMany(),
    primary.contactInquiry.findMany(),
    primary.simulationStore.findMany(),
    primary.accountingTenantStore.findMany(),
    primary.bugReport.findMany(),
    primary.workspacePlugin.findMany(),
    primary.plugin.findMany()
  ]);

  return {
    exportedAt: new Date().toISOString(),
    sourceDatabase: 'Oracle Cloud Always Free VM (PostgreSQL)',
    version: '1.0.0',
    data: {
      users,
      portfolios,
      trades,
      flowNodes,
      invoices,
      documents,
      developmentProjects,
      contactInquiries,
      simulationStores,
      accountingStores,
      bugReports,
      workspacePlugins,
      plugins
    }
  };
}
