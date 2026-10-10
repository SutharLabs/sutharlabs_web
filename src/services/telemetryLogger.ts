/**
 * SutharLabs Enterprise Telemetry & Diagnostics Logger
 * High-performance, low-overhead client & plugin telemetry logging framework
 * Inspired by Datadog Browser SDK, Sentry Breadcrumbs, and OpenTelemetry
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface TelemetryLog {
  id: string;
  timestamp: string;      // ISO string
  timeFormatted: string;  // HH:mm:ss
  level: LogLevel;
  scope: string;          // e.g. "plugin:wp_doc_nexus", "main:auth", "main:network"
  message: string;
  data?: any;             // Context metadata
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  sessionId: string;
  userEmail?: string;
  url?: string;
}

export interface EnvironmentSnapshot {
  userAgent: string;
  browser: string;
  os: string;
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  language: string;
  online: boolean;
  theme?: string;
  activeRoute: string;
  memoryUsage?: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
}

export interface TelemetryPackage {
  snapshotTime: string;
  sessionId: string;
  userEmail?: string;
  environment: EnvironmentSnapshot;
  breadcrumbs: TelemetryLog[];
  recentErrors: TelemetryLog[];
  totalCapturedLogs: number;
}

type LogListener = (log: TelemetryLog) => void;

class TelemetryLoggerService {
  private ringBuffer: TelemetryLog[] = [];
  private maxBufferSize: number = 250;
  private sessionId: string;
  private userEmail?: string;
  private userRole?: string;
  private listeners: Set<LogListener> = new Set();
  private isRemoteSyncEnabled: boolean = true;
  private pendingRemoteBatch: TelemetryLog[] = [];
  private remoteSyncTimeout: any = null;
  private initialized: boolean = false;

  constructor() {
    // Generate or restore session ID
    let sid = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sutharlabs_session_id') : null;
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (typeof sessionStorage !== 'undefined') {
        try { sessionStorage.setItem('sutharlabs_session_id', sid); } catch {}
      }
    }
    this.sessionId = sid;

    // Load recent error breadcrumbs from storage if any
    this.restoreStoredBreadcrumbs();

    // Attach global listeners
    if (typeof window !== 'undefined' && !this.initialized) {
      this.attachGlobalErrorHandlers();
      this.initialized = true;
    }
  }

  private restoreStoredBreadcrumbs() {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('sutharlabs_telemetry_breadcrumbs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.ringBuffer = parsed.slice(-this.maxBufferSize);
        }
      }
    } catch {}
  }

  private persistBreadcrumbs() {
    if (typeof sessionStorage === 'undefined') return;
    try {
      // Save last 50 entries to avoid session storage bloating
      sessionStorage.setItem('sutharlabs_telemetry_breadcrumbs', JSON.stringify(this.ringBuffer.slice(-50)));
    } catch {}
  }

  private attachGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.error('Unhandled runtime script exception', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      }, event.error, 'window:onerror');
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const errorObj = reason instanceof Error ? reason : new Error(String(reason));
      this.error('Unhandled Promise Rejection', {
        reason: String(reason)
      }, errorObj, 'window:unhandledrejection');
    });
  }

  /**
   * Set the active user credentials for live multi-user telemetry attribution
   */
  public setUserContext(user: { email?: string; role?: string } | null) {
    this.userEmail = user?.email || undefined;
    this.userRole = user?.role || undefined;
  }

  /**
   * Create a scoped logger instance for a specific plugin or module
   */
  public scope(scopeName: string) {
    return {
      debug: (message: string, data?: any) => this.debug(message, data, scopeName),
      info: (message: string, data?: any) => this.info(message, data, scopeName),
      warn: (message: string, data?: any) => this.warn(message, data, scopeName),
      error: (message: string, data?: any, error?: Error | any) => this.error(message, data, error, scopeName)
    };
  }

  public log(level: LogLevel, message: string, data?: any, err?: Error | any, scope: string = 'main') {
    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0];
    const logId = `log_${now.getTime()}_${Math.random().toString(36).substring(2, 6)}`;

    let serializedError: TelemetryLog['error'] = undefined;
    if (err) {
      serializedError = {
        name: err.name || 'Error',
        message: err.message || String(err),
        stack: err.stack || undefined
      };
    }

    const entry: TelemetryLog = {
      id: logId,
      timestamp: now.toISOString(),
      timeFormatted,
      level,
      scope,
      message,
      data,
      error: serializedError,
      sessionId: this.sessionId,
      userEmail: this.userEmail,
      url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined
    };

    // Add to circular buffer
    this.ringBuffer.push(entry);
    if (this.ringBuffer.length > this.maxBufferSize) {
      this.ringBuffer.shift();
    }

    // Persist to session storage if warning or error
    if (level === 'ERROR' || level === 'WARN') {
      this.persistBreadcrumbs();
    }

    // Notify local subscribers
    this.listeners.forEach(fn => {
      try { fn(entry); } catch (e) { console.error('[TelemetryLogger] Listener error:', e); }
    });

    // Console logging with pleasant badges in browser devtools
    if (typeof console !== 'undefined') {
      const prefix = `[${timeFormatted}] [${scope}]`;
      switch (level) {
        case 'DEBUG':
          console.debug(prefix, message, data || '');
          break;
        case 'INFO':
          console.info(prefix, message, data || '');
          break;
        case 'WARN':
          console.warn(prefix, message, data || '', err || '');
          break;
        case 'ERROR':
          console.error(prefix, message, data || '', err || '');
          break;
      }
    }

    // Queue for remote telemetry ingestion
    if (this.isRemoteSyncEnabled && (level === 'ERROR' || level === 'WARN')) {
      this.queueRemoteSync(entry);
    }

    return entry;
  }

  public debug(message: string, data?: any, scope: string = 'main') {
    return this.log('DEBUG', message, data, undefined, scope);
  }

  public info(message: string, data?: any, scope: string = 'main') {
    return this.log('INFO', message, data, undefined, scope);
  }

  public warn(message: string, data?: any, scope: string = 'main') {
    return this.log('WARN', message, data, undefined, scope);
  }

  public error(message: string, data?: any, err?: Error | any, scope: string = 'main') {
    return this.log('ERROR', message, data, err, scope);
  }

  /**
   * Subscribe to new log entries in real time
   */
  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all captured breadcrumbs
   */
  public getBreadcrumbs(): TelemetryLog[] {
    return [...this.ringBuffer];
  }

  /**
   * Clear all captured logs
   */
  public clear() {
    this.ringBuffer = [];
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('sutharlabs_telemetry_breadcrumbs');
    }
  }

  /**
   * Detect client environment details
   */
  public getEnvironmentSnapshot(): EnvironmentSnapshot {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'server',
        browser: 'Node.js',
        os: 'Server',
        screenResolution: 'N/A',
        viewportSize: 'N/A',
        devicePixelRatio: 1,
        language: 'en',
        online: true,
        activeRoute: '/'
      };
    }

    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    let os = 'Unknown OS';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    const memory: any = (performance as any)?.memory;

    return {
      userAgent: ua,
      browser,
      os,
      screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      language: navigator.language || 'en-US',
      online: navigator.onLine,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      activeRoute: window.location.pathname + window.location.search,
      memoryUsage: memory ? {
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / (1024 * 1024))
      } : undefined
    };
  }

  /**
   * Generate an all-inclusive diagnostic package for live bug reporting
   */
  public exportTelemetryPackage(limitLogs: number = 80): TelemetryPackage {
    const breadcrumbs = this.ringBuffer.slice(-limitLogs);
    const recentErrors = this.ringBuffer.filter(l => l.level === 'ERROR');

    return {
      snapshotTime: new Date().toISOString(),
      sessionId: this.sessionId,
      userEmail: this.userEmail,
      environment: this.getEnvironmentSnapshot(),
      breadcrumbs,
      recentErrors,
      totalCapturedLogs: this.ringBuffer.length
    };
  }

  private queueRemoteSync(entry: TelemetryLog) {
    this.pendingRemoteBatch.push(entry);
    if (this.remoteSyncTimeout) return;

    this.remoteSyncTimeout = setTimeout(() => {
      this.remoteSyncTimeout = null;
      this.flushRemoteBatch();
    }, 4000);
  }

  private async flushRemoteBatch() {
    if (this.pendingRemoteBatch.length === 0) return;
    const batch = [...this.pendingRemoteBatch];
    this.pendingRemoteBatch = [];

    try {
      const payload = batch.map(b => ({
        sessionId: b.sessionId,
        userEmail: b.userEmail,
        level: b.level,
        scope: b.scope,
        message: b.message,
        data: b.data,
        errorTrace: b.error?.stack || b.error?.message,
        url: b.url,
        timestamp: b.timestamp
      }));

      await fetch('/api/telemetry/client-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: payload })
      });
    } catch {}
  }
}

// Export typed singleton
export const telemetryLogger = new TelemetryLoggerService();

// Attach to window object for runtime inspection & plugin accessibility
if (typeof window !== 'undefined') {
  (window as any).SutharLabsLogger = telemetryLogger;
}

export default telemetryLogger;
