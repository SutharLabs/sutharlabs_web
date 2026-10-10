import fs from 'fs';
import path from 'path';
import os from 'os';
import { getPrismaClient } from '../../api/_utils.js';

export interface BugReportItem {
  id: string;
  trackingId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  module: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Investigating' | 'In Progress' | 'Resolved' | 'Closed';
  environment: {
    browser?: string;
    os?: string;
    screen?: string;
    viewport?: string;
    route?: string;
    userAgent?: string;
    theme?: string;
    [key: string]: any;
  };
  capturedLogs: Array<{
    id?: string;
    timestamp: string;
    timeFormatted?: string;
    level: string;
    scope: string;
    message: string;
    data?: any;
    error?: any;
    [key: string]: any;
  }>;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  adminNotes?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BugReportsStats {
  total: number;
  newCount: number;
  investigatingCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  criticalCount: number;
}

export interface TelemetryLogPayload {
  id?: string;
  sessionId: string;
  userEmail?: string;
  level: string;
  scope: string;
  message: string;
  data?: any;
  errorTrace?: string;
  url?: string;
  timestamp?: string;
}

function getDataDirectory(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'sutharlabs-telemetry');
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }

  const localDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  } catch {}
  return localDir;
}

const BUGS_FILE = path.join(getDataDirectory(), 'bug_reports.json');
const TELEMETRY_FILE = path.join(getDataDirectory(), 'telemetry_logs.json');

function readFallbackBugs(): BugReportItem[] {
  try {
    if (fs.existsSync(BUGS_FILE)) {
      const data = fs.readFileSync(BUGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[BugReportStorage] Fallback read failed:', err);
  }
  return [];
}

function writeFallbackBugs(items: BugReportItem[]) {
  try {
    fs.writeFileSync(BUGS_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.warn('[BugReportStorage] Fallback write failed:', err);
  }
}

function readFallbackTelemetry(): TelemetryLogPayload[] {
  try {
    if (fs.existsSync(TELEMETRY_FILE)) {
      const data = fs.readFileSync(TELEMETRY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch {}
  return [];
}

function writeFallbackTelemetry(items: TelemetryLogPayload[]) {
  try {
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(items.slice(-500), null, 2), 'utf8');
  } catch {}
}

/**
 * Create a new user bug report with captured live logs
 */
export async function createBugReport(params: {
  userEmail: string;
  userName?: string;
  title: string;
  description: string;
  module?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  environment?: any;
  capturedLogs?: any[];
  expectedBehavior?: string;
  actualBehavior?: string;
  ipAddress?: string;
}): Promise<BugReportItem> {
  const trackingId = `BUG-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();
  const id = `bug_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const item: BugReportItem = {
    id,
    trackingId,
    userEmail: params.userEmail.trim().toLowerCase(),
    userName: params.userName?.trim() || 'Anonymous',
    title: params.title.trim(),
    description: params.description.trim(),
    module: params.module?.trim() || 'Main Website',
    severity: params.severity || 'Medium',
    status: 'New',
    environment: params.environment || {},
    capturedLogs: Array.isArray(params.capturedLogs) ? params.capturedLogs : [],
    expectedBehavior: params.expectedBehavior?.trim() || null,
    actualBehavior: params.actualBehavior?.trim() || null,
    adminNotes: null,
    ipAddress: params.ipAddress || null,
    createdAt: now,
    updatedAt: now
  };

  try {
    const prisma = getPrismaClient();
    await (prisma as any).bugReport.create({
      data: {
        id: item.id,
        trackingId: item.trackingId,
        userEmail: item.userEmail,
        userName: item.userName,
        title: item.title,
        description: item.description,
        module: item.module,
        severity: item.severity,
        status: item.status,
        environment: JSON.stringify(item.environment),
        capturedLogs: JSON.stringify(item.capturedLogs),
        expectedBehavior: item.expectedBehavior,
        actualBehavior: item.actualBehavior,
        ipAddress: item.ipAddress
      }
    });
  } catch (dbErr) {
    console.warn('[BugReportStorage] DB insert skipped or table not initialized, saving to fallback:', dbErr);
  }

  // Always update file fallback for maximum reliability
  const current = readFallbackBugs();
  current.unshift(item);
  writeFallbackBugs(current);

  return item;
}

/**
 * Get all bug reports with search and filter capabilities
 */
export async function getBugReports(filters?: {
  status?: string;
  severity?: string;
  module?: string;
  search?: string;
}): Promise<{ reports: BugReportItem[]; stats: BugReportsStats }> {
  let allReports: BugReportItem[] = [];

  try {
    const prisma = getPrismaClient();
    const rows = await (prisma as any).bugReport.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (Array.isArray(rows) && rows.length > 0) {
      allReports = rows.map((r: any) => ({
        id: r.id,
        trackingId: r.trackingId,
        userEmail: r.userEmail,
        userName: r.userName || 'Anonymous',
        title: r.title,
        description: r.description,
        module: r.module,
        severity: r.severity as any,
        status: r.status as any,
        environment: typeof r.environment === 'string' ? JSON.parse(r.environment || '{}') : (r.environment || {}),
        capturedLogs: typeof r.capturedLogs === 'string' ? JSON.parse(r.capturedLogs || '[]') : (r.capturedLogs || []),
        expectedBehavior: r.expectedBehavior,
        actualBehavior: r.actualBehavior,
        adminNotes: r.adminNotes,
        ipAddress: r.ipAddress,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
      }));
    } else {
      allReports = readFallbackBugs();
    }
  } catch (err) {
    allReports = readFallbackBugs();
  }

  // Calculate stats across all reports before filtering
  const stats: BugReportsStats = {
    total: allReports.length,
    newCount: allReports.filter(r => r.status === 'New').length,
    investigatingCount: allReports.filter(r => r.status === 'Investigating').length,
    inProgressCount: allReports.filter(r => r.status === 'In Progress').length,
    resolvedCount: allReports.filter(r => r.status === 'Resolved').length,
    closedCount: allReports.filter(r => r.status === 'Closed').length,
    criticalCount: allReports.filter(r => r.severity === 'Critical').length
  };

  // Apply filters
  let filtered = allReports;

  if (filters?.status && filters.status !== 'All') {
    filtered = filtered.filter(r => r.status.toLowerCase() === filters.status!.toLowerCase());
  }

  if (filters?.severity && filters.severity !== 'All') {
    filtered = filtered.filter(r => r.severity.toLowerCase() === filters.severity!.toLowerCase());
  }

  if (filters?.module && filters.module !== 'All') {
    filtered = filtered.filter(r => r.module.toLowerCase() === filters.module!.toLowerCase());
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.trackingId.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.userName.toLowerCase().includes(q) ||
      r.module.toLowerCase().includes(q)
    );
  }

  return { reports: filtered, stats };
}

/**
 * Update bug report status and admin notes
 */
export async function updateBugReport(
  id: string,
  updates: {
    status?: 'New' | 'Investigating' | 'In Progress' | 'Resolved' | 'Closed';
    severity?: 'Low' | 'Medium' | 'High' | 'Critical';
    adminNotes?: string;
  }
): Promise<BugReportItem | null> {
  const now = new Date().toISOString();

  try {
    const prisma = getPrismaClient();
    const updated = await (prisma as any).bugReport.update({
      where: { id },
      data: {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.severity ? { severity: updates.severity } : {}),
        ...(updates.adminNotes !== undefined ? { adminNotes: updates.adminNotes } : {}),
        updatedAt: new Date()
      }
    });

    if (updated) {
      // Sync fallback
      const fallback = readFallbackBugs();
      const idx = fallback.findIndex(b => b.id === id);
      if (idx !== -1) {
        fallback[idx] = {
          ...fallback[idx],
          ...updates,
          updatedAt: now
        };
        writeFallbackBugs(fallback);
      }
      return {
        id: updated.id,
        trackingId: updated.trackingId,
        userEmail: updated.userEmail,
        userName: updated.userName,
        title: updated.title,
        description: updated.description,
        module: updated.module,
        severity: updated.severity as any,
        status: updated.status as any,
        environment: typeof updated.environment === 'string' ? JSON.parse(updated.environment || '{}') : (updated.environment || {}),
        capturedLogs: typeof updated.capturedLogs === 'string' ? JSON.parse(updated.capturedLogs || '[]') : (updated.capturedLogs || []),
        expectedBehavior: updated.expectedBehavior,
        actualBehavior: updated.actualBehavior,
        adminNotes: updated.adminNotes,
        ipAddress: updated.ipAddress,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: now
      };
    }
  } catch (err) {
    // Fallback update
    const fallback = readFallbackBugs();
    const idx = fallback.findIndex(b => b.id === id);
    if (idx !== -1) {
      fallback[idx] = {
        ...fallback[idx],
        ...updates,
        updatedAt: now
      };
      writeFallbackBugs(fallback);
      return fallback[idx];
    }
  }

  return null;
}

/**
 * Delete a bug report
 */
export async function deleteBugReport(id: string): Promise<boolean> {
  try {
    const prisma = getPrismaClient();
    await (prisma as any).bugReport.delete({ where: { id } });
  } catch {}

  const fallback = readFallbackBugs();
  const next = fallback.filter(b => b.id !== id);
  writeFallbackBugs(next);
  return true;
}

/**
 * Ingest live telemetry logs from client sessions
 */
export async function ingestTelemetryLogs(logs: TelemetryLogPayload[]): Promise<number> {
  if (!Array.isArray(logs) || logs.length === 0) return 0;

  try {
    const prisma = getPrismaClient();
    for (const log of logs.slice(0, 50)) {
      await (prisma as any).liveTelemetryLog.create({
        data: {
          sessionId: log.sessionId || 'anonymous',
          userEmail: log.userEmail || null,
          level: log.level || 'INFO',
          scope: log.scope || 'main',
          message: log.message,
          data: log.data ? (typeof log.data === 'string' ? log.data : JSON.stringify(log.data)) : null,
          errorTrace: log.errorTrace || null,
          url: log.url || null,
          timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
        }
      }).catch(() => {});
    }
  } catch {}

  const current = readFallbackTelemetry();
  current.push(...logs);
  writeFallbackTelemetry(current);

  return logs.length;
}

/**
 * Get recent live telemetry logs for admin monitoring
 */
export async function getLiveTelemetryLogs(limit: number = 100): Promise<TelemetryLogPayload[]> {
  try {
    const prisma = getPrismaClient();
    const rows = await (prisma as any).liveTelemetryLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' }
    });

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({
        id: r.id,
        sessionId: r.sessionId,
        userEmail: r.userEmail,
        level: r.level,
        scope: r.scope,
        message: r.message,
        data: r.data ? JSON.parse(r.data) : null,
        errorTrace: r.errorTrace,
        url: r.url,
        timestamp: new Date(r.timestamp).toISOString()
      }));
    }
  } catch {}

  return readFallbackTelemetry().slice(-limit).reverse();
}
