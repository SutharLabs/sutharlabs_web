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
      status: 'OFFLINE'
    };
  }

  try {
    const isNeon = url.includes("neon.tech");
    const normalized = url.replace(/^postgres:/, 'http:').replace(/^postgresql:/, 'http:');
    const parsed = new URL(normalized);
    const host = parsed.hostname;
    const isOracle = host === '137.23.61.191' || host.includes('oracle') || (!isNeon && host !== 'localhost');

    return {
      role,
      provider: isNeon 
        ? 'Neon Serverless PostgreSQL' 
        : isOracle 
        ? 'Oracle Cloud Always Free VM (PostgreSQL)' 
        : 'Standard PostgreSQL Instance',
      host,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname.replace(/^\//, '') || 'sutharlabs_production',
      user: parsed.username ? `${parsed.username.slice(0, 4)}***` : 'admin',
      isNeon,
      isOracle,
      adapter: isNeon ? '@prisma/adapter-neon (WebSocket)' : '@prisma/adapter-pg (Pool)'
    };
  } catch {
    return {
      role,
      provider: 'PostgreSQL Database',
      host: 'Configured via URI',
      port: 5432,
      database: 'sutharlabs_production',
      user: 'admin',
      isNeon: false,
      isOracle: false,
      adapter: '@prisma/adapter-pg'
    };
  }
}

export async function getDatabaseStatus() {
  const primaryPrisma = getPrismaClient();
  const backupPrisma = getBackupPrismaClient();

  const primaryMeta = parseDatabaseMetadata(process.env["DATABASE_URL"], 'primary');
  const backupMeta = parseDatabaseMetadata(process.env["BACKUP_DATABASE_URL"], 'backup');

  // Test Primary Connection & Latency
  let primaryStatus = 'UNKNOWN';
  let primaryLatencyMs = -1;
  let primaryStats: Record<string, number> = {};

  try {
    const start = Date.now();
    const [userCount, portfolioCount, simCount, invoiceCount, nodeCount, docCount, bugCount, inquiryCount, pluginCount, tradeCount] = await Promise.all([
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
    primaryStatus = 'OFFLINE';
    console.error("[DatabaseSyncService] Primary health check error:", err.message);
  }

  // Test Backup Connection & Latency
  let backupStatus = 'NOT_CONFIGURED';
  let backupLatencyMs = -1;
  let backupStats: Record<string, number> = {};

  if (backupPrisma) {
    try {
      const start = Date.now();
      const [userCount, portfolioCount, simCount, invoiceCount, nodeCount, docCount, bugCount, inquiryCount, pluginCount, tradeCount] = await Promise.all([
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
    lastSyncStats
  };
}

export async function executeDatabaseSync() {
  const primary = getPrismaClient();
  const backup = getBackupPrismaClient();

  if (!backup) {
    throw new Error("Backup database is not configured in BACKUP_DATABASE_URL");
  }

  const startTime = Date.now();
  const syncedCounts: Record<string, number> = {};

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

  return {
    success: true,
    message: `Database synchronization complete. ${totalRecords} records synced to Neon backup across ${Object.keys(syncedCounts).length} tables in ${durationMs}ms.`,
    durationMs,
    syncedCounts,
    timestamp: lastSyncTimestamp
  };
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

