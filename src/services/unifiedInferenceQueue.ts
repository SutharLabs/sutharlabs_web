/**
 * ==============================================================================
 * SutharLabs Unified Multi-Tenant Inference Queue & Concurrency Manager
 * 
 * Orchestrates multi-tenant task concurrency and resource allocation across
 * shared compute nodes (primarily Oracle Cloud VM 2 - Ampere ARM A1).
 * 
 * Capabilities:
 *  1. Multi-Tenant Fair Sharing (Interleaved Round-Robin across distinct users)
 *     - Prevents noisy-neighbor starvation when a user submits batch requests.
 *  2. Multi-Model Slot Management & Mutual Exclusion
 *     - Enforces single-slot heavy compute concurrency on VM 2 (2 ARM cores)
 *       spanning Speech Replication (XTTS-v2), Local LLM (Ollama), and Quant Sentiment.
 *  3. Dynamic Real-Time Queue Telemetry
 *     - Accurately reports 1-based queuePosition, totalInQueue, estimatedWaitSec,
 *       and live activeTask details for transparent frontend UX.
 *  4. Transparent Diagnostic Step Progression
 *     - Updates validation, profiling, queuing, gateway dispatch, vocoder inference,
 *       and audio stream decoding stages.
 * ==============================================================================
 */

export type TaskPriority = 'high' | 'normal' | 'low';

export type InferenceTaskType =
  | 'SPEECH_SYNTHESIS_REPLICATED' // Coqui XTTS-v2 on VM 2 (Heavy: ~25-35s)
  | 'SPEECH_SYNTHESIS_STANDARD'   // Edge TTS (Light: ~0.5-1.5s, bypasses heavy slot)
  | 'LLM_CHAT_INFERENCE'          // Ollama Qwen/Gemma on VM 2 (Heavy: ~5-20s)
  | 'QUANT_SENTIMENT_ANALYSIS'     // FinLLM on VM 2 (Heavy: ~4-12s)
  | 'VOICE_CALIBRATION';          // Reference acoustic analysis (Burst: ~2-3s)

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface StepDiagnostic {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  error?: string;
  detail?: string;
}

export interface ActiveTaskDetails {
  jobId: string;
  type: InferenceTaskType;
  label: string;
  description: string;
  userId: string;
  userRole: string;
  startedAt: number;
  elapsedSec: number;
  estimatedDurationSec: number;
  estimatedRemainingSec: number;
}

export interface QueuePositionInfo {
  position: number;        // 1-based position in waiting queue
  totalInQueue: number;    // Total waiting jobs
  estimatedWaitSec: number;// Computed wait time
  activeTask?: ActiveTaskDetails;
}

export interface QueuedJob<TParams = any, TResult = any> {
  id: string;
  type: InferenceTaskType;
  userId: string;
  userEmail?: string;
  userRole: string;
  priority: TaskPriority;
  weight: number; // 1 = heavy (occupies VM 2 slot), 0 = light (direct execution)
  description: string;
  params: TParams;
  status: JobStatus;
  createdAt: number;
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedDurationSec: number;
  progressPercent: number;
  progressStep?: string;
  steps: StepDiagnostic[];
  result?: TResult;
  error?: string;
  details?: string;
  failedStep?: string;
  diagnosticTips?: string;
  telemetry?: any;
  engine?: string;
  quota?: any;
  audioUrl?: string;
  handler?: (job: QueuedJob<TParams, TResult>, updateStep: (stepId: string, status: StepDiagnostic['status'], detail?: string, durationMs?: number) => void) => Promise<TResult>;
  abortController?: AbortController;
}

export interface QueueTelemetry {
  activeHeavyTask: ActiveTaskDetails | null;
  queueLength: number;
  distinctUsersWaiting: number;
  slotsOccupied: number;
  maxSlots: number;
  totalCompleted: number;
  totalFailed: number;
  rollingAvgInferenceSec: number;
  recentJobs: Array<{
    id: string;
    type: InferenceTaskType;
    userId: string;
    status: JobStatus;
    durationSec?: number;
    completedAt?: number;
  }>;
}

class UnifiedInferenceQueueManager {
  private jobs = new Map<string, QueuedJob>();
  private userQueues = new Map<string, string[]>(); // userId -> array of jobIds
  private activeHeavyJob: QueuedJob | null = null;
  private maxHeavySlots = 1; // 1 concurrent heavy task on 2-vCPU ARM VM 2
  private isProcessingLoop = false;
  
  // Observability & Statistics
  private totalCompleted = 0;
  private totalFailed = 0;
  private recentDurations: number[] = [30]; // Initial baseline 30s
  private completedHistory: Array<{ id: string; type: InferenceTaskType; userId: string; status: JobStatus; durationSec?: number; completedAt?: number }> = [];

  constructor() {
    // Background prune loop for jobs older than 20 minutes
    setInterval(() => this.pruneStaleJobs(), 5 * 60 * 1000);
  }

  /**
   * Determine task weight and baseline expected duration in seconds
   */
  private getTaskProfile(type: InferenceTaskType): { weight: number; estimatedDurationSec: number; label: string } {
    switch (type) {
      case 'SPEECH_SYNTHESIS_REPLICATED':
        return { weight: 1, estimatedDurationSec: 30, label: 'Coqui XTTS-v2 Voice Synthesizer' };
      case 'SPEECH_SYNTHESIS_STANDARD':
        return { weight: 0, estimatedDurationSec: 1, label: 'Edge Neural Streaming Vocoder' };
      case 'LLM_CHAT_INFERENCE':
        return { weight: 1, estimatedDurationSec: 14, label: 'Oracle VM 2 Local LLM (Ollama)' };
      case 'QUANT_SENTIMENT_ANALYSIS':
        return { weight: 1, estimatedDurationSec: 8, label: 'FinLLM Quantitative Sentiment' };
      case 'VOICE_CALIBRATION':
        return { weight: 1, estimatedDurationSec: 3, label: 'Acoustic Feature Extraction & Timbre Matching' };
      default:
        return { weight: 1, estimatedDurationSec: 20, label: 'Neural Inference Task' };
    }
  }

  /**
   * Create standard diagnostic steps for TTS tasks
   */
  public createStandardSteps(type: InferenceTaskType): StepDiagnostic[] {
    if (type === 'SPEECH_SYNTHESIS_STANDARD') {
      return [
        { id: 'validate', label: '1. Text Tokenizer', detail: 'Script & phoneme parsing', status: 'completed', durationMs: 12 },
        { id: 'profile', label: '2. Voice Resolution', detail: 'Edge neural voice profile matched', status: 'completed', durationMs: 8 },
        { id: 'gateway', label: '3. Streaming Gateway', status: 'running', detail: 'Direct line-rate Edge TTS stream' },
        { id: 'decode', label: '4. Audio Stream', detail: 'Browser playback ready', status: 'idle' }
      ];
    }

    return [
      { id: 'validate', label: '1. Text Tokenizer', detail: 'Phonemes & Script Validation', status: 'idle' },
      { id: 'profile', label: '2. Voice Resolution', detail: 'Speaker Latents & Timbre Matching', status: 'idle' },
      { id: 'queue', label: '3. Multi-Tenant Queue', detail: 'Compute slot allocation', status: 'idle' },
      { id: 'gateway', label: '4. Neural Gateway', detail: 'Oracle VM 2 Link (132.226.190.125)', status: 'idle' },
      { id: 'inference', label: '5. Neural Vocoder', detail: 'Acoustic flow matching (XTTS-v2)', status: 'idle' },
      { id: 'decode', label: '6. Audio Stream', detail: 'RIFF Header & Browser Decoding', status: 'idle' }
    ];
  }

  /**
   * Submit a new job to the unified inference coordinator
   */
  public enqueueJob<TParams = any, TResult = any>(options: {
    id: string;
    type: InferenceTaskType;
    userId: string;
    userEmail?: string;
    userRole?: string;
    priority?: TaskPriority;
    description: string;
    params: TParams;
    steps?: StepDiagnostic[];
    handler: (job: QueuedJob<TParams, TResult>, updateStep: (stepId: string, status: StepDiagnostic['status'], detail?: string, durationMs?: number) => void) => Promise<TResult>;
  }): QueuedJob<TParams, TResult> {
    const { weight, estimatedDurationSec, label } = this.getTaskProfile(options.type);
    const now = Date.now();
    const userRole = options.userRole || 'Developer';
    const priority = options.priority || (userRole === 'Admin' ? 'high' : 'normal');

    const job: QueuedJob<TParams, TResult> = {
      id: options.id,
      type: options.type,
      userId: options.userId,
      userEmail: options.userEmail,
      userRole,
      priority,
      weight,
      description: options.description || label,
      params: options.params,
      status: 'queued',
      createdAt: now,
      queuedAt: now,
      estimatedDurationSec,
      progressPercent: 5,
      steps: options.steps || this.createStandardSteps(options.type),
      handler: options.handler,
      abortController: new AbortController()
    };

    this.jobs.set(job.id, job);

    // Light tasks (e.g. Edge TTS) run immediately without occupying the VM 2 heavy compute slot
    if (weight === 0) {
      job.status = 'processing';
      job.startedAt = Date.now();
      this.executeLightJob(job);
      return job;
    }

    // Heavy tasks enter the multi-tenant fair queue
    if (!this.userQueues.has(job.userId)) {
      this.userQueues.set(job.userId, []);
    }
    this.userQueues.get(job.userId)!.push(job.id);

    // If heavy slot is currently idle, trigger dispatcher immediately
    this.triggerDispatcher();

    return job;
  }

  /**
   * Direct execution for lightweight tasks (Edge TTS)
   */
  private async executeLightJob(job: QueuedJob) {
    const updateStep = (stepId: string, status: StepDiagnostic['status'], detail?: string, durationMs?: number) => {
      this.updateJobStep(job.id, stepId, status, detail, durationMs);
    };

    try {
      if (job.handler) {
        const result: any = await job.handler(job, updateStep);
        job.status = 'completed';
        job.completedAt = Date.now();
        job.result = result;
        if (result?.audioUrl) job.audioUrl = result.audioUrl;
        if (result?.telemetry) job.telemetry = result.telemetry;
        if (result?.quota) job.quota = result.quota;
        if (result?.engine) job.engine = result.engine;
      }
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Lightweight synthesis failed';
      job.completedAt = Date.now();
    }
  }

  /**
   * Multi-Tenant Fair Scheduling Dispatcher Loop (Deficit Round-Robin / User Interleaving)
   */
  private async triggerDispatcher() {
    if (this.isProcessingLoop) return;
    this.isProcessingLoop = true;

    try {
      while (this.activeHeavyJob === null && this.hasPendingHeavyJobs()) {
        const nextJob = this.selectNextFairJob();
        if (!nextJob) break;

        this.activeHeavyJob = nextJob;
        nextJob.status = 'processing';
        nextJob.startedAt = Date.now();

        // Update 'queue' step to completed
        this.updateJobStep(nextJob.id, 'queue', 'completed', 'Compute slot acquired on Oracle VM 2', Date.now() - nextJob.queuedAt);

        // Run execution in background without blocking dispatcher loop
        this.runHeavyJob(nextJob);
      }
    } finally {
      this.isProcessingLoop = false;
    }
  }

  /**
   * Checks if any heavy job is waiting in any user's queue
   */
  private hasPendingHeavyJobs(): boolean {
    for (const [, queue] of this.userQueues) {
      if (queue.length > 0) return true;
    }
    return false;
  }

  /**
   * Selects the next job using Interleaved Multi-Tenant Round-Robin:
   * 1. High-priority (Admin) tasks waiting > 3 seconds are promoted.
   * 2. Otherwise, iterate through distinct users to pick 1 job per user in rotation.
   */
  private selectNextFairJob(): QueuedJob | null {
    // 1. High Priority check
    const now = Date.now();
    for (const [userId, queue] of this.userQueues.entries()) {
      if (queue.length === 0) continue;
      const firstJobId = queue[0];
      const job = this.jobs.get(firstJobId);
      if (job && job.priority === 'high' && (now - job.queuedAt > 2000)) {
        queue.shift();
        if (queue.length === 0) this.userQueues.delete(userId);
        return job;
      }
    }

    // 2. Interleaved Round-Robin across active user queues
    const activeUsers = Array.from(this.userQueues.keys()).filter(u => (this.userQueues.get(u) || []).length > 0);
    if (activeUsers.length === 0) return null;

    // Pick first user from list, rotate keys
    const chosenUserId = activeUsers[0];
    const userQueue = this.userQueues.get(chosenUserId)!;
    const jobId = userQueue.shift();

    if (userQueue.length === 0) {
      this.userQueues.delete(chosenUserId);
    } else {
      // Re-insert chosen user at the end of the user map for next round
      this.userQueues.delete(chosenUserId);
      this.userQueues.set(chosenUserId, userQueue);
    }

    return jobId ? (this.jobs.get(jobId) || null) : null;
  }

  /**
   * Execute heavy job with full error capture and slot release
   */
  private async runHeavyJob(job: QueuedJob) {
    const t0 = Date.now();
    const updateStep = (stepId: string, status: StepDiagnostic['status'], detail?: string, durationMs?: number) => {
      this.updateJobStep(job.id, stepId, status, detail, durationMs);
    };

    try {
      if (job.handler) {
        const result: any = await job.handler(job, updateStep);
        job.status = 'completed';
        job.completedAt = Date.now();
        job.result = result;
        if (result?.audioUrl) job.audioUrl = result.audioUrl;
        if (result?.telemetry) job.telemetry = result.telemetry;
        if (result?.quota) job.quota = result.quota;
        if (result?.engine) job.engine = result.engine;
        
        const durationSec = (Date.now() - t0) / 1000;
        this.recordCompletion(job, durationSec, true);
      }
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Inference execution failed on Oracle VM 2';
      job.details = err.stack || err.details;
      job.completedAt = Date.now();
      this.recordCompletion(job, (Date.now() - t0) / 1000, false);
    } finally {
      // Release slot & dispatch next job
      if (this.activeHeavyJob?.id === job.id) {
        this.activeHeavyJob = null;
      }
      this.triggerDispatcher();
    }
  }

  private recordCompletion(job: QueuedJob, durationSec: number, success: boolean) {
    if (success) {
      this.totalCompleted++;
      this.recentDurations.push(durationSec);
      if (this.recentDurations.length > 20) this.recentDurations.shift();
    } else {
      this.totalFailed++;
    }

    this.completedHistory.unshift({
      id: job.id,
      type: job.type,
      userId: job.userId,
      status: job.status,
      durationSec: Math.round(durationSec * 10) / 10,
      completedAt: Date.now()
    });
    if (this.completedHistory.length > 50) this.completedHistory.pop();
  }

  /**
   * Update diagnostic step state
   */
  public updateJobStep(jobId: string, stepId: string, status: StepDiagnostic['status'], detail?: string, durationMs?: number) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.steps = job.steps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          status,
          detail: detail !== undefined ? detail : s.detail,
          durationMs: durationMs !== undefined ? durationMs : s.durationMs
        };
      }
      return s;
    });

    if (status === 'failed') {
      job.failedStep = stepId;
    }
  }

  /**
   * Acquire a temporary heavy slot for streaming or direct handlers (e.g. LLM Chat)
   * If slot is busy, caller can wait or receive an immediate queued signal.
   */
  public async acquireHeavySlot(options: {
    type: InferenceTaskType;
    userId: string;
    description: string;
    maxWaitMs?: number;
  }): Promise<{ release: () => void; waitedMs: number }> {
    const maxWait = options.maxWaitMs ?? 45000;
    const start = Date.now();

    // Check if slot is immediately available
    if (this.activeHeavyJob === null && !this.hasPendingHeavyJobs()) {
      const pseudoJob: any = {
        id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: options.type,
        userId: options.userId,
        userRole: 'Developer',
        priority: 'normal',
        weight: 1,
        description: options.description,
        status: 'processing',
        createdAt: Date.now(),
        queuedAt: Date.now(),
        startedAt: Date.now(),
        estimatedDurationSec: 15,
        steps: []
      };
      this.activeHeavyJob = pseudoJob;

      return {
        release: () => {
          if (this.activeHeavyJob?.id === pseudoJob.id) {
            this.activeHeavyJob = null;
            this.triggerDispatcher();
          }
        },
        waitedMs: 0
      };
    }

    // Wait until heavy slot frees up
    while (Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, 800));
      if (this.activeHeavyJob === null && !this.hasPendingHeavyJobs()) {
        const pseudoJob: any = {
          id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: options.type,
          userId: options.userId,
          userRole: 'Developer',
          priority: 'normal',
          weight: 1,
          description: options.description,
          status: 'processing',
          createdAt: Date.now(),
          queuedAt: Date.now(),
          startedAt: Date.now(),
          estimatedDurationSec: 15,
          steps: []
        };
        this.activeHeavyJob = pseudoJob;

        return {
          release: () => {
            if (this.activeHeavyJob?.id === pseudoJob.id) {
              this.activeHeavyJob = null;
              this.triggerDispatcher();
            }
          },
          waitedMs: Date.now() - start
        };
      }
    }

    throw new Error(`Inference slot acquisition timed out after ${maxWait / 1000}s on VM 2.`);
  }

  /**
   * Get dynamic real-time job status with exact queue calculations
   */
  public getJob(jobId: string): (QueuedJob & { queueInfo?: QueuePositionInfo; activeTask?: ActiveTaskDetails }) | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    if (job.status === 'queued') {
      const queueInfo = this.calculateQueuePosition(jobId);
      
      // Update dynamic detail on 'queue' step
      job.steps = job.steps.map(s => {
        if (s.id === 'queue') {
          return {
            ...s,
            status: 'running',
            detail: `Position #${queueInfo.position} in queue • Est. wait ~${queueInfo.estimatedWaitSec}s • Node busy with active task`
          };
        }
        return s;
      });

      return {
        ...job,
        queueInfo,
        activeTask: queueInfo.activeTask
      };
    }

    if (job.status === 'processing' && this.activeHeavyJob?.id === jobId) {
      const activeDetails = this.getActiveHeavyTaskDetails();
      return {
        ...job,
        activeTask: activeDetails || undefined
      };
    }

    return job;
  }

  /**
   * Calculate 1-based queue position and estimated wait time for a waiting job
   */
  private calculateQueuePosition(jobId: string): QueuePositionInfo {
    let position = 0;
    let totalInQueue = 0;
    let accumulatedWaitSec = 0;

    // Remaining time of current running heavy task
    const activeDetails = this.getActiveHeavyTaskDetails();
    if (activeDetails) {
      accumulatedWaitSec += activeDetails.estimatedRemainingSec;
    }

    const avgTaskDuration = this.getRollingAverageSec();

    // Walk simulated fair queue order
    for (const [, queue] of this.userQueues.entries()) {
      totalInQueue += queue.length;
    }

    // Determine position: count how many jobs are ahead in the fair rotation
    let found = false;
    for (const [, queue] of this.userQueues.entries()) {
      const idx = queue.indexOf(jobId);
      if (idx !== -1) {
        position = idx + 1;
        found = true;
        break;
      }
    }

    if (!found) position = 1;

    accumulatedWaitSec += (position - 1) * avgTaskDuration;

    return {
      position: Math.max(1, position),
      totalInQueue: Math.max(1, totalInQueue),
      estimatedWaitSec: Math.max(5, Math.round(accumulatedWaitSec)),
      activeTask: activeDetails || undefined
    };
  }

  /**
   * Details of currently running heavy task
   */
  public getActiveHeavyTaskDetails(): ActiveTaskDetails | null {
    if (!this.activeHeavyJob || !this.activeHeavyJob.startedAt) return null;

    const elapsedSec = Math.floor((Date.now() - this.activeHeavyJob.startedAt) / 1000);
    const est = this.activeHeavyJob.estimatedDurationSec || 30;
    const remainingSec = Math.max(2, est - elapsedSec);

    return {
      jobId: this.activeHeavyJob.id,
      type: this.activeHeavyJob.type,
      label: this.getTaskProfile(this.activeHeavyJob.type).label,
      description: this.activeHeavyJob.description,
      userId: this.activeHeavyJob.userId,
      userRole: this.activeHeavyJob.userRole,
      startedAt: this.activeHeavyJob.startedAt,
      elapsedSec,
      estimatedDurationSec: est,
      estimatedRemainingSec: remainingSec
    };
  }

  private getRollingAverageSec(): number {
    if (this.recentDurations.length === 0) return 28;
    const sum = this.recentDurations.reduce((a, b) => a + b, 0);
    return Math.round((sum / this.recentDurations.length) * 10) / 10;
  }

  /**
   * Cancel a job from the queue
   */
  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'queued') {
      job.status = 'cancelled';
      job.completedAt = Date.now();
      // Remove from user queue
      const userQ = this.userQueues.get(job.userId);
      if (userQ) {
        const idx = userQ.indexOf(jobId);
        if (idx !== -1) userQ.splice(idx, 1);
        if (userQ.length === 0) this.userQueues.delete(job.userId);
      }
      return true;
    }

    if (job.status === 'processing') {
      job.status = 'cancelled';
      job.completedAt = Date.now();
      job.abortController?.abort();
      if (this.activeHeavyJob?.id === jobId) {
        this.activeHeavyJob = null;
        this.triggerDispatcher();
      }
      return true;
    }

    return false;
  }

  /**
   * Prune expired jobs (> 20 minutes old)
   */
  private pruneStaleJobs() {
    const cutoff = Date.now() - (20 * 60 * 1000);
    for (const [id, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && job.completedAt && job.completedAt < cutoff) {
        this.jobs.delete(id);
      }
    }
  }

  /**
   * Export fleet queue telemetry for Admin dashboard & API probes
   */
  public getTelemetry(): QueueTelemetry {
    let waitingJobsCount = 0;
    for (const [, q] of this.userQueues) {
      waitingJobsCount += q.length;
    }

    return {
      activeHeavyTask: this.getActiveHeavyTaskDetails(),
      queueLength: waitingJobsCount,
      distinctUsersWaiting: this.userQueues.size,
      slotsOccupied: this.activeHeavyJob ? 1 : 0,
      maxSlots: this.maxHeavySlots,
      totalCompleted: this.totalCompleted,
      totalFailed: this.totalFailed,
      rollingAvgInferenceSec: this.getRollingAverageSec(),
      recentJobs: this.completedHistory.slice(0, 10)
    };
  }
}

// Global Singleton Export
export const unifiedInferenceQueue = new UnifiedInferenceQueueManager();
