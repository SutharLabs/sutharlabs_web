import { listSimulations, runEODSimulation } from "./tradeSimulator.js";
import { getPrismaClient } from "../../../../api/_utils.js";

let workerIntervalTimer: NodeJS.Timeout | null = null;
let isWorkerRunning = false;
let isCycleExecuting = false;
let lastCycleTimestamp: string | null = null;
let lastCycleResult: { processedCount: number; errors: number; note: string } | null = null;
let cycleCount = 0;

export interface SimulatorWorkerStatus {
  enabled: boolean;
  isExecuting: boolean;
  cycleIntervalMs: number;
  cycleCount: number;
  lastCycleTimestamp: string | null;
  lastCycleResult: { processedCount: number; errors: number; note: string } | null;
  activeSimulationsCount: number;
}

const DEFAULT_CYCLE_INTERVAL_MS = 60 * 1000; // 60 seconds (1 minute)

/**
 * Execute one automated evaluation cycle across all registered simulation instances.
 */
export async function executeAutomationCycle(): Promise<{ processedCount: number; errors: number; note: string }> {
  if (isCycleExecuting) {
    return { processedCount: 0, errors: 0, note: "Previous cycle still in progress; skipping." };
  }

  isCycleExecuting = true;
  cycleCount += 1;
  const startTime = Date.now();
  let processed = 0;
  let errors = 0;

  try {
    let simulations = listSimulations();

    // Query Neon PostgreSQL simulation_stores to ensure any saved user instances are automatically discovered
    try {
      const prisma = getPrismaClient();
      const dbStores = await prisma.simulationStore.findMany({
        where: { simId: { not: "default" } },
        select: { simId: true, label: true, isPublic: true, owner: true, market: true, productType: true, timeframe: true }
      });
      if (dbStores && dbStores.length > 0) {
        const knownIds = new Set(simulations.map(s => s.id));
        for (const store of dbStores) {
          if (!knownIds.has(store.simId)) {
            simulations.push({
              id: store.simId,
              label: store.label || store.simId,
              isPublic: store.isPublic,
              owner: store.owner || undefined,
              market: store.market || "IN",
              productType: (store.productType || "CNC") as any,
              timeframe: (store.timeframe || "1d") as any
            } as any);
          }
        }
      }
    } catch (dbErr) {
      // Fallback silently to registry list if DB temporarily unavailable
    }

    if (!simulations || simulations.length === 0) {
      lastCycleResult = { processedCount: 0, errors: 0, note: "No simulations registered." };
      lastCycleTimestamp = new Date().toISOString();
      return lastCycleResult;
    }

    for (const sim of simulations) {
      try {
        const simId = sim.id;
        await runEODSimulation({
          simulationId: simId,
          isCron: true
        });
        processed += 1;
      } catch (err: any) {
        errors += 1;
        console.warn(`[Simulator Worker] Error running simulation ${sim.id}:`, err?.message || err);
      }
    }

    const elapsedMs = Date.now() - startTime;
    lastCycleResult = {
      processedCount: processed,
      errors,
      note: `Evaluated ${processed} simulation(s) in ${elapsedMs}ms (${errors} errors)`
    };
    lastCycleTimestamp = new Date().toISOString();
    return lastCycleResult;
  } catch (globalErr: any) {
    lastCycleResult = {
      processedCount: processed,
      errors: errors + 1,
      note: `Global cycle error: ${globalErr?.message || globalErr}`
    };
    lastCycleTimestamp = new Date().toISOString();
    return lastCycleResult;
  } finally {
    isCycleExecuting = false;
  }
}

/**
 * Starts the continuous native background simulator worker in PM2.
 */
export function startSimulatorBackgroundWorker(intervalMs: number = DEFAULT_CYCLE_INTERVAL_MS): void {
  if (workerIntervalTimer) {
    clearInterval(workerIntervalTimer);
    workerIntervalTimer = null;
  }

  isWorkerRunning = true;
  console.log(`[Simulator Worker] Starting autonomous background trading worker (interval: ${intervalMs / 1000}s)...`);

  // Run first cycle shortly after startup (after 5 seconds warm-up)
  setTimeout(() => {
    executeAutomationCycle().catch(err => {
      console.warn("[Simulator Worker] Initial cycle error:", err);
    });
  }, 5000);

  workerIntervalTimer = setInterval(() => {
    executeAutomationCycle().catch(err => {
      console.warn("[Simulator Worker] Scheduled cycle error:", err);
    });
  }, intervalMs);
}

/**
 * Stops the background worker.
 */
export function stopSimulatorBackgroundWorker(): void {
  if (workerIntervalTimer) {
    clearInterval(workerIntervalTimer);
    workerIntervalTimer = null;
  }
  isWorkerRunning = false;
  console.log("[Simulator Worker] Background trading worker stopped.");
}

/**
 * Returns current health and telemetry of the background simulator worker.
 */
export function getSimulatorWorkerStatus(): SimulatorWorkerStatus {
  const simulations = listSimulations();
  return {
    enabled: isWorkerRunning,
    isExecuting: isCycleExecuting,
    cycleIntervalMs: DEFAULT_CYCLE_INTERVAL_MS,
    cycleCount,
    lastCycleTimestamp,
    lastCycleResult,
    activeSimulationsCount: simulations ? simulations.length : 0
  };
}

