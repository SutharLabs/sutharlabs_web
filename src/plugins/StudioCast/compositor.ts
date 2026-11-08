import { VirtualPreset, LowerThirdConfig } from './types.js';

export interface ParticipantStreamSource {
  id: string;
  name: string;
  role: string;
  videoElement: HTMLVideoElement | null;
  audioLevel: number;
}

export class StudioCastCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private currentPreset: VirtualPreset = 'split';
  private lowerThird: LowerThirdConfig = {
    showTitle: 'SutharLabs Sovereign Podcast',
    subtitle: 'Deep Dive: Sovereign Infrastructure & Edge AI',
    topicTicker: 'LIVE BROADCAST • HIGH FIDELITY AUDIO • ZERO-LATENCY WEBRTC',
    isVisible: true,
    accentColor: '#00dbe7'
  };

  private participants: ParticipantStreamSource[] = [];
  private isRunning: boolean = false;
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private theme: 'light' | 'dark' = 'dark';

  constructor(width: number = 1280, height: number = 720) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context for compositor');
    this.ctx = context;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getStream(fps: number = 30): MediaStream {
    return (this.canvas as any).captureStream ? (this.canvas as any).captureStream(fps) : new MediaStream();
  }

  public setPreset(preset: VirtualPreset) {
    this.currentPreset = preset;
  }

  public setTheme(theme: 'light' | 'dark') {
    this.theme = theme;
  }

  public setIsRecording(recording: boolean) {
    this.isRecording = Boolean(recording);
    if (this.isRecording) {
      if (!this.recordingStartTime) {
        this.recordingStartTime = Date.now();
      }
    } else {
      this.recordingStartTime = 0;
    }
  }

  public setLowerThird(config: Partial<LowerThirdConfig>) {
    this.lowerThird = { ...this.lowerThird, ...config };
  }

  public updateParticipants(participants: ParticipantStreamSource[]) {
    this.participants = participants;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timecodeStart = Date.now();
    this.renderLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderLoop = () => {
    if (!this.isRunning) return;
    this.drawFrame();
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  private drawFrame() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Studio Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, w, h);
    if (this.theme === 'light') {
      bgGradient.addColorStop(0, '#f8fafc');
      bgGradient.addColorStop(0.5, '#f1f5f9');
      bgGradient.addColorStop(1, '#e2e8f0');
    } else if (this.currentPreset === 'minimal_cyber') {
      bgGradient.addColorStop(0, '#04070a');
      bgGradient.addColorStop(0.5, '#071015');
      bgGradient.addColorStop(1, '#020305');
    } else {
      bgGradient.addColorStop(0, '#0c0d12');
      bgGradient.addColorStop(0.5, '#12141c');
      bgGradient.addColorStop(1, '#090a0f');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Subtle Studio Grid Pattern
    ctx.strokeStyle = this.theme === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Render Virtual Preset Framing
    const activeParticipants = this.participants.filter(p => p.videoElement !== null);

    switch (this.currentPreset) {
      case 'split':
        this.drawSplitPreset(w, h, activeParticipants);
        break;
      case 'grid':
        this.drawGridPreset(w, h, activeParticipants);
        break;
      case 'spotlight_pip':
        this.drawPipPreset(w, h, activeParticipants);
        break;
      case 'newsroom':
        this.drawNewsroomPreset(w, h, activeParticipants);
        break;
      case 'minimal_cyber':
        this.drawCyberMinimalPreset(w, h, activeParticipants);
        break;
    }

    // 3. Lower Thirds Overlay
    if (this.lowerThird.isVisible) {
      this.drawLowerThird(w, h);
    }

    // 4. Studio Watermark / Indicator Header
    this.drawStudioHeader(w, h);
  }

  // PRESET 1: SIDE-BY-SIDE 50/50 SPLIT
  private drawSplitPreset(w: number, h: number, participants: ParticipantStreamSource[]) {
    const margin = 24;
    const gap = 16;
    const availableWidth = w - (margin * 2) - gap;
    const frameW = availableWidth / 2;
    const frameH = h - (margin * 2) - (this.lowerThird.isVisible ? 70 : 0);

    const p1 = participants[0];
    const p2 = participants[1];

    this.drawParticipantFrame(margin, margin, frameW, frameH, p1, 'HOST');
    this.drawParticipantFrame(margin + frameW + gap, margin, frameW, frameH, p2, 'CO-HOST / GUEST');
  }

  // PRESET 2: 2x2 STUDIO GRID
  private drawGridPreset(w: number, h: number, participants: ParticipantStreamSource[]) {
    const margin = 20;
    const gap = 14;
    const frameW = (w - (margin * 2) - gap) / 2;
    const frameH = (h - (margin * 2) - gap - (this.lowerThird.isVisible ? 60 : 0)) / 2;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * (frameW + gap);
      const y = margin + row * (frameH + gap);
      this.drawParticipantFrame(x, y, frameW, frameH, participants[i], `FEED #${i + 1}`);
    }
  }

  // PRESET 3: SPEAKER SPOTLIGHT WITH PICTURE-IN-PICTURE
  private drawPipPreset(w: number, h: number, participants: ParticipantStreamSource[]) {
    const mainP = participants[0];
    const guestP = participants[1];

    // Main background frame (fills studio)
    this.drawParticipantFrame(0, 0, w, h - (this.lowerThird.isVisible ? 80 : 0), mainP, 'PRIMARY SPEAKER', false);

    // Floating PIP thumbnail bottom-right
    if (guestP) {
      const pipW = Math.round(w * 0.28);
      const pipH = Math.round(pipW * (9 / 16));
      const pipX = w - pipW - 24;
      const pipY = h - pipH - (this.lowerThird.isVisible ? 110 : 30);

      this.ctx.save();
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      this.ctx.shadowBlur = 18;
      this.drawParticipantFrame(pipX, pipY, pipW, pipH, guestP, 'GUEST IN-PICTURE', true, '#ce5dff');
      this.ctx.restore();
    }
  }

  // PRESET 4: BROADCAST NEWSROOM
  private drawNewsroomPreset(w: number, h: number, participants: ParticipantStreamSource[]) {
    const margin = 28;
    const bottomReserve = 120;
    const gap = 20;
    const frameW = (w - (margin * 2) - gap) / 2;
    const frameH = h - margin - bottomReserve;

    this.drawParticipantFrame(margin, margin, frameW, frameH, participants[0], 'ANCHOR • DESK 1', true, '#00dbe7');
    this.drawParticipantFrame(margin + frameW + gap, margin, frameW, frameH, participants[1], 'REMOTE GUEST', true, '#f59e0b');
  }

  // PRESET 5: CYBERPUNK SOVEREIGN MINIMAL
  private drawCyberMinimalPreset(w: number, h: number, participants: ParticipantStreamSource[]) {
    const margin = 20;
    const gap = 16;
    const bottomReserve = this.lowerThird.isVisible ? 80 : 20;
    const frameW = (w - (margin * 2) - gap) / 2;
    const frameH = h - margin - bottomReserve;

    this.drawParticipantFrame(margin, margin, frameW, frameH, participants[0], 'NODE_HOST // 01', true, '#00dbe7');
    this.drawParticipantFrame(margin + frameW + gap, margin, frameW, frameH, participants[1], 'PEER_GUEST // 02', true, '#74f5ff');

    // Central Audio Spectrum Ticker Line
    const midY = h - bottomReserve + 10;
    this.ctx.strokeStyle = '#00dbe7';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(margin, midY);
    for (let x = margin; x < w - margin; x += 10) {
      const amp = Math.sin((x + Date.now() * 0.005) * 0.05) * 6;
      this.ctx.lineTo(x, midY + amp);
    }
    this.ctx.stroke();
  }

  // COMMON FRAME DRAWER FOR EACH VIDEO SOURCE
  private drawParticipantFrame(
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    p?: ParticipantStreamSource, 
    fallbackLabel: string = 'OFFLINE',
    rounded: boolean = true,
    accentColor: string = '#00dbe7'
  ) {
    const { ctx } = this;
    const radius = rounded ? 14 : 0;

    ctx.save();

    // Clip to rounded rectangle
    if (rounded) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.clip();
    }

    if (p && p.videoElement && p.videoElement.readyState >= 2) {
      // Draw video with aspect ratio fill
      const vid = p.videoElement;
      const vidW = vid.videoWidth || 640;
      const vidH = vid.videoHeight || 480;
      const vidRatio = vidW / vidH;
      const frameRatio = w / h;

      let drawW = w;
      let drawH = h;
      let drawX = x;
      let drawY = y;

      if (vidRatio > frameRatio) {
        drawW = h * vidRatio;
        drawX = x - (drawW - w) / 2;
      } else {
        drawH = w / vidRatio;
        drawY = y - (drawH - h) / 2;
      }

      ctx.drawImage(vid, drawX, drawY, drawW, drawH);
    } else {
      // Offline Avatar Placeholder
      if (this.theme === 'light') {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      } else {
        ctx.fillStyle = '#10121a';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      }
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p ? `Connecting ${p.name}...` : `[ ${fallbackLabel} ]`, x + w / 2, y + h / 2);
    }

    ctx.restore();

    // Border Frame & Active Speaker Glow
    if (rounded) {
      ctx.save();
      const isSpeaking = p && p.audioLevel > 15;
      ctx.strokeStyle = isSpeaking ? accentColor : (this.theme === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)');
      ctx.lineWidth = isSpeaking ? 3 : 1.5;
      if (isSpeaking) {
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.stroke();
      ctx.restore();
    }

    // Name Tag Badge (Bottom-Left)
    if (p || fallbackLabel) {
      const labelText = p ? p.name : fallbackLabel;
      ctx.save();
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(labelText).width;
      const badgeW = textWidth + 32;
      const badgeH = 24;
      const badgeX = x + 12;
      const badgeY = y + h - badgeH - 12;

      ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Audio status indicator dot
      ctx.fillStyle = p && p.audioLevel > 10 ? '#00e476' : '#849495';
      ctx.beginPath();
      ctx.arc(badgeX + 10, badgeY + badgeH / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, badgeX + 20, badgeY + badgeH / 2);

      ctx.restore();
    }
  }

  // LOWER THIRDS BROADCAST BANNER
  private drawLowerThird(w: number, h: number) {
    const { ctx } = this;
    const bannerH = 68;
    const bannerY = h - bannerH - 14;
    const margin = 24;
    const bannerW = w - margin * 2;

    ctx.save();

    // Banner Background Glass
    const grad = ctx.createLinearGradient(margin, bannerY, margin + bannerW, bannerY);
    if (this.theme === 'light') {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.7, 'rgba(248, 250, 252, 0.92)');
      grad.addColorStop(1, 'rgba(241, 245, 249, 0.95)');
    } else {
      grad.addColorStop(0, 'rgba(12, 15, 24, 0.94)');
      grad.addColorStop(0.7, 'rgba(18, 22, 34, 0.92)');
      grad.addColorStop(1, 'rgba(10, 12, 18, 0.94)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(margin, bannerY, bannerW, bannerH, 10);
    ctx.fill();

    // Top Accent Border Line
    ctx.fillStyle = this.lowerThird.accentColor || '#00dbe7';
    ctx.fillRect(margin, bannerY, bannerW, 3);

    // Left Icon Badge Box
    const boxW = 56;
    ctx.fillStyle = this.theme === 'light' ? 'rgba(0, 219, 231, 0.18)' : 'rgba(0, 219, 231, 0.12)';
    ctx.fillRect(margin, bannerY + 3, boxW, bannerH - 3);

    ctx.fillStyle = this.lowerThird.accentColor || '#00dbe7';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE', margin + boxW / 2, bannerY + bannerH / 2);

    // Show Title & Subtitle
    ctx.textAlign = 'left';
    ctx.fillStyle = this.theme === 'light' ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(this.lowerThird.showTitle, margin + boxW + 16, bannerY + 24);

    ctx.fillStyle = this.theme === 'light' ? '#475569' : '#a0aec0';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(this.lowerThird.subtitle, margin + boxW + 16, bannerY + 48);

    // Right-hand Clock & Timecode
    if (this.isRecording && this.recordingStartTime > 0) {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.recordingStartTime) / 1000));
      const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
      const ss = String(elapsedSeconds % 60).padStart(2, '0');
      const timecodeStr = `● REC ${mm}:${ss}`;

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(timecodeStr, margin + bannerW - 16, bannerY + 36);
    } else {
      ctx.textAlign = 'right';
      ctx.fillStyle = this.theme === 'light' ? '#64748b' : '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('STANDBY // READY', margin + bannerW - 16, bannerY + 36);
    }

    ctx.restore();
  }

  // TOP STATUS HEADER
  private drawStudioHeader(_w: number, _h: number) {
    const { ctx } = this;
    ctx.save();

    ctx.fillStyle = this.theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(10, 12, 18, 0.7)';
    ctx.beginPath();
    ctx.roundRect(24, 16, 170, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#00dbe7';
    ctx.beginPath();
    ctx.arc(36, 28, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.theme === 'light' ? '#0f172a' : '#e2e8f0';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('STUDIOCAST // VIRTUAL', 46, 28);

    ctx.restore();
  }
}

