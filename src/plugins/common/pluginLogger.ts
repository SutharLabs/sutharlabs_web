/**
 * ==============================================================================
 * SutharLabs Universal Plugin Logging & Error Traceability Framework
 * ==============================================================================
 * Provides high-performance, structured, trace-correlated logging across all
 * workspace plugins, integrating client telemetry breadcrumbs and server logs.
 * ==============================================================================
 */

export type PluginLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface PluginLogContext {
  traceId?: string;
  userId?: string;
  userEmail?: string;
  operation?: string;
  durationMs?: number;
  httpStatus?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface PluginLogEntry {
  timestamp: string;
  pluginId: string;
  component: string;
  level: PluginLogLevel;
  message: string;
  traceId: string;
  durationMs?: number;
  context?: PluginLogContext;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

export interface PluginSpan {
  operation: string;
  traceId: string;
  startTime: number;
  end: (extraContext?: Record<string, any>) => number;
  fail: (err: any, extraContext?: Record<string, any>) => number;
}

function generateTraceId(): string {
  return `trc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

export class PluginLogger {
  readonly pluginId: string;
  readonly component: string;
  private currentTraceId: string;

  constructor(pluginId: string, component: string = 'core') {
    this.pluginId = pluginId;
    this.component = component;
    this.currentTraceId = generateTraceId();
  }

  /**
   * Set or inherit an explicit correlation traceId across async boundaries
   */
  withTraceId(traceId: string): PluginLogger {
    const child = new PluginLogger(this.pluginId, this.component);
    child.currentTraceId = traceId;
    return child;
  }

  getTraceId(): string {
    return this.currentTraceId;
  }

  startSpan(operation: string, initialContext?: Record<string, any>): PluginSpan {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const traceId = this.currentTraceId;
    this.debug(`[SPAN:START] ${operation}`, { ...initialContext, traceId });

    return {
      operation,
      traceId,
      startTime: t0,
      end: (extra?: Record<string, any>) => {
        const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const durationMs = Math.round((t1 - t0) * 10) / 10;
        this.info(`[SPAN:OK] ${operation} completed in ${durationMs}ms`, { ...extra, durationMs, traceId });
        return durationMs;
      },
      fail: (err: any, extra?: Record<string, any>) => {
        const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const durationMs = Math.round((t1 - t0) * 10) / 10;
        this.error(`[SPAN:FAIL] ${operation} failed after ${durationMs}ms: ${err?.message || err}`, err, { ...extra, durationMs, traceId });
        return durationMs;
      }
    };
  }

  debug(message: string, context?: PluginLogContext): void {
    this.log('DEBUG', message, undefined, context);
  }

  info(message: string, context?: PluginLogContext): void {
    this.log('INFO', message, undefined, context);
  }

  warn(message: string, context?: PluginLogContext): void {
    this.log('WARN', message, undefined, context);
  }

  error(message: string, errorOrContext?: any, context?: PluginLogContext): void {
    let errObj: any = undefined;
    let effectiveContext = context;

    if (errorOrContext instanceof Error) {
      errObj = {
        name: errorOrContext.name,
        message: errorOrContext.message,
        stack: errorOrContext.stack
      };
    } else if (typeof errorOrContext === 'string') {
      errObj = { message: errorOrContext };
    } else if (errorOrContext && typeof errorOrContext === 'object') {
      if (errorOrContext.message || errorOrContext.stack) {
        errObj = {
          name: errorOrContext.name,
          message: errorOrContext.message,
          stack: errorOrContext.stack
        };
      } else {
        effectiveContext = { ...errorOrContext, ...context };
      }
    }

    this.log('ERROR', message, errObj, effectiveContext);
  }

  private log(level: PluginLogLevel, message: string, error?: { name?: string; message: string; stack?: string }, context?: PluginLogContext): void {
    const timestamp = new Date().toISOString();
    const traceId = context?.traceId || this.currentTraceId;

    const entry: PluginLogEntry = {
      timestamp,
      pluginId: this.pluginId,
      component: this.component,
      level,
      message,
      traceId,
      durationMs: context?.durationMs,
      context,
      error
    };

    // 1. Browser Client Environment Formatting
    if (typeof window !== 'undefined') {
      const scopeBadge = `[Plugin:${this.pluginId}:${this.component}]`;
      const levelColors: Record<PluginLogLevel, string> = {
        DEBUG: 'color: #94a3b8; font-weight: bold;',
        INFO: 'color: #0284c7; font-weight: bold;',
        WARN: 'color: #d97706; font-weight: bold;',
        ERROR: 'color: #e11d48; font-weight: bold;'
      };

      const prefix = `%c${scopeBadge}%c [${traceId.slice(-6)}] %c${level}%c`;
      const styles = [
        'background: #1e293b; color: #38bdf8; border-radius: 3px; padding: 1px 4px; font-weight: bold;',
        'color: #64748b;',
        levelColors[level],
        'color: inherit;'
      ];

      if (level === 'ERROR') {
        console.error(prefix, ...styles, message, error || '', context || '');
      } else if (level === 'WARN') {
        console.warn(prefix, ...styles, message, context || '');
      } else if (level === 'DEBUG') {
        console.debug(prefix, ...styles, message, context || '');
      } else {
        console.log(prefix, ...styles, message, context || '');
      }

      // Synchronize with TelemetryLogger ring buffer if available
      try {
        const w = window as any;
        if (w.__sutharlabs_telemetry) {
          w.__sutharlabs_telemetry.push({
            id: generateTraceId(),
            timestamp,
            timeFormatted: timestamp.split('T')[1].slice(0, 8),
            level,
            scope: `plugin:${this.pluginId}:${this.component}`,
            message: `[${traceId}] ${message}`,
            data: context,
            error
          });
        }
      } catch {}
      return;
    }

    // 2. Node.js Server Environment Formatting (Structured Output)
    const logLine = `[${timestamp}] [Plugin:${this.pluginId}:${this.component}] [${traceId}] [${level}] ${message}` +
      (entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : '') +
      (error ? ` | Error: ${error.message}${error.stack ? `\n${error.stack}` : ''}` : '') +
      (context && Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(context)}` : '');

    if (level === 'ERROR') {
      console.error(logLine);
    } else if (level === 'WARN') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  }
}

/**
 * Factory helper for clean logger instantiation
 */
export function createPluginLogger(pluginId: string, component?: string): PluginLogger {
  return new PluginLogger(pluginId, component);
}

export default createPluginLogger;
