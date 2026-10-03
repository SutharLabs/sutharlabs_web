import os from "os";

interface RequestSample {
  timestamp: number;
  durationMs: number;
  status: number;
}

const recentRequests: RequestSample[] = [];
let totalRequestsCount = 0;

export function recordApiRequest(durationMs: number, status: number) {
  totalRequestsCount++;
  const now = Date.now();
  recentRequests.push({ timestamp: now, durationMs, status });
  // Prune samples older than 15 seconds
  const cutoff = now - 15000;
  while (recentRequests.length > 0 && recentRequests[0].timestamp < cutoff) {
    recentRequests.shift();
  }
}

export function getRequestMetrics() {
  const now = Date.now();
  const windowSec = 10;
  const cutoff = now - (windowSec * 1000);
  const inWindow = recentRequests.filter(r => r.timestamp >= cutoff);
  
  const ratePerSec = Math.round((inWindow.length / windowSec) * 10) / 10;
  const avgLatencyMs = inWindow.length > 0
    ? Math.round(inWindow.reduce((sum, r) => sum + r.durationMs, 0) / inWindow.length)
    : 0;

  return {
    ratePerSec,
    avgLatencyMs,
    totalRequests: totalRequestsCount
  };
}

function getCpuSnapshot() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return { idle: 0, total: 1 };
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += (cpu.times as any)[type];
    }
    idle += cpu.times.idle;
  }
  return { idle: idle / cpus.length, total: total / cpus.length };
}

let lastCpuSample = getCpuSnapshot();

export function getSystemTelemetry() {
  const cpus = os.cpus();
  const currentSample = getCpuSnapshot();
  const idleDiff = currentSample.idle - lastCpuSample.idle;
  const totalDiff = currentSample.total - lastCpuSample.total;
  lastCpuSample = currentSample;

  let cpuUsage = 0;
  if (totalDiff > 0) {
    cpuUsage = Math.max(1, Math.min(100, Math.round(100 - (100 * idleDiff / totalDiff))));
  } else if (currentSample.total > 0) {
    cpuUsage = Math.max(1, Math.min(100, Math.round(100 - (100 * currentSample.idle / currentSample.total))));
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsagePercent = Math.max(1, Math.min(100, Math.round((usedMem / totalMem) * 100)));
  const totalGB = Number((totalMem / (1024 ** 3)).toFixed(1));
  const usedGB = Number((usedMem / (1024 ** 3)).toFixed(1));
  const freeGB = Number((freeMem / (1024 ** 3)).toFixed(1));
  const heapUsedMB = Math.round(process.memoryUsage().heapUsed / (1024 * 1024));

  const cpuModel = cpus[0]?.model?.trim() || "Host Processor";
  const cpuCores = cpus.length;
  const cpuSpeed = cpus[0]?.speed ? `${(cpus[0].speed / 1000).toFixed(2)} GHz` : "";

  const uptimeSeconds = Math.round(os.uptime());
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeFormatted = days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;

  const platform = os.platform();
  const platformName = platform === "win32" ? "Windows" : platform === "darwin" ? "macOS" : "Linux";
  const dbUrl = process.env["NEON_DB_URL"] || process.env["DATABASE_URL"] || "";
  const dbName = dbUrl.includes("neon") ? "Neon Serverless PG" : dbUrl.includes("postgres") ? "PostgreSQL" : "SQLite DB";

  const reqMetrics = getRequestMetrics();

  return {
    cpu: {
      usagePercent: cpuUsage,
      model: cpuModel,
      cores: cpuCores,
      speed: cpuSpeed,
    },
    memory: {
      usagePercent: memoryUsagePercent,
      totalGB,
      usedGB,
      freeGB,
      heapUsedMB,
    },
    requests: {
      ratePerSec: reqMetrics.ratePerSec,
      avgLatencyMs: reqMetrics.avgLatencyMs,
      totalRequests: reqMetrics.totalRequests,
    },
    system: {
      platform: platformName,
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptimeSeconds,
      uptimeFormatted,
      isLocalhost: !process.env.VERCEL,
      environment: process.env.NODE_ENV === "production" ? "Production" : "Development (Localhost)",
      database: dbName
    }
  };
}
