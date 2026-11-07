import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Radio,
  Square,
  Download,
  Copy,
  Check,
  Share2,
  Users,
  MessageSquare,
  Sliders,
  Sparkles,
  Layers,
  Settings,
  Circle,
  Eye,
  Tv,
  LayoutGrid,
  Columns2,
  Maximize2,
  ShieldCheck,
  RefreshCw,
  X,
  Volume2,
  Film,
  Plus
} from 'lucide-react';
import { WorkspacePluginViewProps } from '../../types.js';
import { 
  VirtualPreset, 
  StudioCastRoom, 
  StudioCastParticipant, 
  StudioCastChatMessage, 
  IsoRecordingTrack,
  LowerThirdConfig 
} from '../types.js';
import { StudioCastCompositor, ParticipantStreamSource } from '../compositor.js';
import ConfirmModal, { ModalVariant } from '../../../components/ConfirmModal.js';

export default function StudioCastView({
  logs: _logs,
  onAddLog,
  userEmail,
  userToken: _userToken,
  theme,
  userRole: _userRole
}: WorkspacePluginViewProps) {
  const effectiveTheme: 'light' | 'dark' = theme || (
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const isLight = effectiveTheme === 'light';

  // Room & Role State
  const [roomId, setRoomId] = useState<string>('POD-8492');
  const [roomTitle, setRoomTitle] = useState<string>('Sovereign Engineering & Edge Intelligence');
  const [userName, setUserName] = useState<string>(() => userEmail?.split('@')[0] || 'HostSuresh');
  const [userRole, setUserRole] = useState<'host' | 'co-host' | 'guest'>('host');
  const [myPeerId] = useState<string>(() => `peer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  
  // Media Streams State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0);

  // Participants & Virtual Presets State
  const [participants, setParticipants] = useState<StudioCastParticipant[]>([]);
  const [currentPreset, setCurrentPreset] = useState<VirtualPreset>('split');
  const [activeTab, setActiveTab] = useState<'virtual_studio' | 'webcams' | 'recordings'>('virtual_studio');
  const [sidePanelTab, setSidePanelTab] = useState<'presets' | 'chat' | 'participants'>('presets');

  // Lower-Thirds Config
  const [lowerThird, setLowerThird] = useState<LowerThirdConfig>({
    showTitle: 'SutharLabs Sovereign Studio',
    subtitle: 'Autonomous Agentic Architectures & High-Throughput Vaults',
    topicTicker: 'LIVE BROADCAST // ZERO-LATENCY WEBRTC // ISOLATED ISO TRACKS',
    isVisible: true,
    accentColor: '#00dbe7'
  });

  // Recording State
  const [isRecordingComposed, setIsRecordingComposed] = useState<boolean>(false);
  const [isRecordingRawHost, setIsRecordingRawHost] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedTracks, setRecordedTracks] = useState<IsoRecordingTrack[]>([]);

  // Chat State
  const [chatMessages, setChatMessages] = useState<StudioCastChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // UI Helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtext?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ModalVariant;
    isAlert?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const guestVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const compositorRef = useRef<StudioCastCompositor | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const composedRecorderRef = useRef<MediaRecorder | null>(null);
  const rawRecorderRef = useRef<MediaRecorder | null>(null);
  const composedChunksRef = useRef<Blob[]>([]);
  const rawChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingTimerRef = useRef<any>(null);

  const addLog = useCallback((message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' = 'INFO') => {
    if (onAddLog) {
      onAddLog({
        source: 'STUDIOCAST',
        message: `[StudioCast] ${message}`,
        type,
        timestamp: new Date().toLocaleTimeString()
      } as any);
    }
  }, [onAddLog]);

  // Read URL search params for room joining
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setRoomId(roomParam.toUpperCase());
        setUserRole('guest');
        addLog(`Joining room ${roomParam} as guest.`, 'INFO');
      }
    }
  }, [addLog]);

  // 1. Initialize Compositor Canvas
  useEffect(() => {
    const compositor = new StudioCastCompositor(1280, 720);
    compositorRef.current = compositor;
    compositor.setPreset(currentPreset);
    compositor.setLowerThird(lowerThird);
    compositor.start();

    if (canvasContainerRef.current) {
      canvasContainerRef.current.innerHTML = '';
      const canvasEl = compositor.getCanvas();
      canvasEl.className = 'w-full h-full object-contain rounded-xl shadow-2xl';
      canvasContainerRef.current.appendChild(canvasEl);
    }

    return () => {
      compositor.stop();
    };
  }, []);

  // Sync preset changes to compositor
  useEffect(() => {
    if (compositorRef.current) {
      compositorRef.current.setPreset(currentPreset);
    }
  }, [currentPreset]);

  // Sync lower third changes to compositor
  useEffect(() => {
    if (compositorRef.current) {
      compositorRef.current.setLowerThird(lowerThird);
    }
  }, [lowerThird]);

  // 2. Local Media Acquisition & Audio Meter
  const startLocalMedia = useCallback(async () => {
    try {
      // Clean up previous local stream tracks before requesting new ones
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Audio Meter Visualizer via Web Audio API
      try {
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudio = () => {
          if (!analyser || !audioContextRef.current || audioContextRef.current.state === 'closed') return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setLocalAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (err) {
        console.warn('Audio analyser error:', err);
      }

      addLog('Camera and microphone connected successfully.', 'SUCCESS');
    } catch (err: any) {
      console.warn('Media access error:', err);
      addLog(`Could not access camera/mic: ${err.message}. Operating in preview mode.`, 'ERROR');
    }
  }, [addLog]);

  useEffect(() => {
    startLocalMedia();
    return () => {
      // Clean up all hardware camera & mic tracks immediately on leaving the plugin
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => {
          t.stop();
        });
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => {
          t.stop();
        });
        screenStreamRef.current = null;
      }
      if (composedRecorderRef.current && composedRecorderRef.current.state !== 'inactive') {
        try { composedRecorderRef.current.stop(); } catch {}
        composedRecorderRef.current = null;
      }
      if (rawRecorderRef.current && rawRecorderRef.current.state !== 'inactive') {
        try { rawRecorderRef.current.stop(); } catch {}
        rawRecorderRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (compositorRef.current) {
        compositorRef.current.stop();
      }
    };
  }, []);

  // Update compositor source frames
  useEffect(() => {
    if (compositorRef.current) {
      const sources: ParticipantStreamSource[] = [
        {
          id: myPeerId,
          name: `${userName} (Host)`,
          role: userRole,
          videoElement: isCameraOn ? localVideoRef.current : null,
          audioLevel: isMicOn ? localAudioLevel : 0
        }
      ];

      // Add guest source if available
      if (guestVideoRef.current) {
        sources.push({
          id: 'guest_peer_1',
          name: 'Co-Host / Guest',
          role: 'guest',
          videoElement: guestVideoRef.current,
          audioLevel: Math.random() > 0.4 ? Math.round(Math.random() * 60) : 0
        });
      }

      compositorRef.current.updateParticipants(sources);
    }
  }, [myPeerId, userName, userRole, isCameraOn, isMicOn, localAudioLevel, participants]);

  // 3. Toggle Controls
  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const nextState = !isCameraOn;
      stream.getVideoTracks().forEach(t => {
        t.enabled = nextState;
      });
      setIsCameraOn(nextState);
      addLog(`Camera ${nextState ? 'resumed' : 'stopped (hardware blanked)'}.`, 'INFO');
    }
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const nextState = !isMicOn;
      stream.getAudioTracks().forEach(t => {
        t.enabled = nextState;
      });
      setIsMicOn(nextState);
      addLog(`Microphone ${nextState ? 'unmuted' : 'muted'}.`, 'INFO');
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      startLocalMedia();
      addLog('Screen sharing stopped; returned to camera feed.', 'INFO');
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        setLocalStream(screenStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(() => {});
        }
        setIsScreenSharing(true);
        addLog('Screen sharing active.', 'SUCCESS');

        screenStream.getVideoTracks()[0].onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
          }
          setIsScreenSharing(false);
          startLocalMedia();
          addLog('Screen sharing ended via browser controls.', 'INFO');
        };
      } catch (err: any) {
        console.warn('Screen share cancelled:', err);
      }
    }
  };

  // 4. Quick Patching of Presets
  const applyPreset = (preset: VirtualPreset) => {
    setCurrentPreset(preset);
    addLog(`Switched virtual studio preset to "${preset.toUpperCase()}".`, 'INFO');
  };

  // 5. Recording Engines: Composed Program Stream & Raw Host ISO Track
  const startComposedRecording = () => {
    if (!compositorRef.current) return;
    try {
      const stream = compositorRef.current.getStream(30);
      // Mix local audio if available
      if (localStream && localStream.getAudioTracks().length > 0) {
        stream.addTrack(localStream.getAudioTracks()[0]);
      }

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      composedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) composedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(composedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const newTrack: IsoRecordingTrack = {
          id: `track_${Date.now()}`,
          title: `Composed Virtual Program (${currentPreset.toUpperCase()})`,
          participantName: 'Studio Program Output',
          type: 'composed_virtual',
          format: 'webm',
          durationSeconds: recordingSeconds,
          sizeBytes: blob.size,
          blobUrl: url,
          createdAt: new Date().toLocaleTimeString()
        };
        setRecordedTracks(prev => [newTrack, ...prev]);
        addLog(`Composed video recorded successfully (${formatBytes(blob.size)}).`, 'SUCCESS');
      };

      recorder.start(1000);
      composedRecorderRef.current = recorder;
      setIsRecordingComposed(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      addLog('Started recording composed virtual broadcast stream.', 'SUCCESS');
    } catch (err: any) {
      console.error('Failed to start composed recording:', err);
      addLog(`Failed to record composed stream: ${err.message}`, 'ERROR');
    }
  };

  const stopComposedRecording = () => {
    if (composedRecorderRef.current && composedRecorderRef.current.state !== 'inactive') {
      try {
        composedRecorderRef.current.requestData();
        composedRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error requesting final composed recorder data:', err);
      }
      setIsRecordingComposed(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      addLog('Composed broadcast recording finalized and added to ISO library.', 'SUCCESS');
    }
  };

  const startRawHostRecording = () => {
    const stream = localStreamRef.current || localStream;
    if (!stream) return;
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      rawChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) rawChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(rawChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const newTrack: IsoRecordingTrack = {
          id: `raw_host_${Date.now()}`,
          title: `Raw Host ISO Stream (${userName})`,
          participantName: userName,
          type: 'raw_video',
          format: 'webm',
          durationSeconds: recordingSeconds,
          sizeBytes: blob.size,
          blobUrl: url,
          createdAt: new Date().toLocaleTimeString()
        };
        setRecordedTracks(prev => [newTrack, ...prev]);
        addLog(`Raw host ISO track recorded (${formatBytes(blob.size)}).`, 'SUCCESS');
      };

      recorder.start(1000);
      rawRecorderRef.current = recorder;
      setIsRecordingRawHost(true);
      addLog('Started recording raw host ISO camera track.', 'SUCCESS');
    } catch (err: any) {
      addLog(`Failed to start raw recording: ${err.message}`, 'ERROR');
    }
  };

  const stopRawHostRecording = () => {
    if (rawRecorderRef.current && rawRecorderRef.current.state !== 'inactive') {
      try {
        rawRecorderRef.current.requestData();
        rawRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error requesting final raw recorder data:', err);
      }
      setIsRecordingRawHost(false);
      addLog('Raw host ISO recording finalized and added to ISO library.', 'SUCCESS');
    }
  };

  // 6. Copy Links & Utilities
  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const shareInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.sutharlabs.com';
    const link = `${origin}/workspace?plugin=studiocast&room=${roomId}`;
    copyToClipboard(link, 'invite-link');
    addLog(`Copied podcast invite link for room "${roomId}".`, 'INFO');
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg: StudioCastChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: myPeerId,
      senderName: userName,
      role: userRole,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  function formatTime(totalSeconds: number): string {
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  return (
    <div className={`flex flex-col h-full font-sans transition-colors duration-150 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#0a0a0c] text-[#e5e1e4]'
    }`}>
      {/* Hidden Source Video Elements for Canvas Ingestion */}
      <video ref={localVideoRef} muted playsInline autoPlay className="hidden" />
      <video ref={guestVideoRef} playsInline autoPlay className="hidden" />

      {/* Top Application Bar */}
      <header className={`p-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#101014] border-[#3a494b]/30'
      }`}>
        {/* Brand & Room Identity Badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#00dbe7]/10 border border-[#00dbe7]/25 flex items-center justify-center shrink-0 shadow-sm">
            <Radio className="w-5 h-5 text-[#00dbe7] shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base sm:text-lg font-bold tracking-tight font-sans ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                StudioCast
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                {roomId}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                userRole === 'host'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {userRole}
              </span>
            </div>
            <p className={`text-xs font-mono mt-0.5 truncate max-w-md ${
              isLight ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {roomTitle}
            </p>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {/* Share Podcast Invite Link Button */}
          <button
            type="button"
            onClick={shareInviteLink}
            className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                : 'bg-[#201f21] hover:bg-[#28272a] text-[#e5e1e4] border border-[#3a494b]/40 hover:text-[#00dbe7]'
            }`}
            title="Share guest invite link"
          >
            {copiedKey === 'invite-link' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-500">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                <span>Invite Guests</span>
              </>
            )}
          </button>

          {/* Master Composed Stream Record Button */}
          {!isRecordingComposed ? (
            <button
              type="button"
              onClick={startComposedRecording}
              className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Circle className="w-3 h-3 fill-white shrink-0" />
              <span>Record Program</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopComposedRecording}
              className="h-8 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Square className="w-3 h-3 fill-white shrink-0" />
              <span>Stop REC ({formatTime(recordingSeconds)})</span>
            </button>
          )}

          {/* Raw Host ISO Track Record Button */}
          {!isRecordingRawHost ? (
            <button
              type="button"
              onClick={startRawHostRecording}
              className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
              title="Record uncompressed host ISO camera track"
            >
              <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Record ISO Track</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRawHostRecording}
              className="h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-purple-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Square className="w-3 h-3 fill-white shrink-0" />
              <span>Stop Host ISO</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Viewport & Side Rail Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left & Center Viewport (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col p-4 space-y-3.5 overflow-y-auto">
          {/* Quick Virtual Presets Rail */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 overflow-x-auto ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/30'
          }`}>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                Virtual Presets:
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-nowrap">
              {[
                { id: 'split' as const, label: 'Side-by-Side (50/50)', icon: Columns2 },
                { id: 'newsroom' as const, label: 'Broadcast Newsroom', icon: Tv },
                { id: 'spotlight_pip' as const, label: 'Spotlight + PIP', icon: Maximize2 },
                { id: 'grid' as const, label: 'Studio Grid (2x2)', icon: LayoutGrid },
                { id: 'minimal_cyber' as const, label: 'Cyber Minimal', icon: Sparkles }
              ].map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`h-7 px-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                    currentPreset === preset.id
                      ? isLight
                        ? 'bg-sky-500 text-white shadow-xs font-bold'
                        : 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/50 shadow-xs'
                      : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 text-on-surface-variant'
                  }`}
                >
                  <preset.icon className="w-3 h-3 shrink-0" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Composed Virtual Stage Canvas */}
          <div className="flex-1 min-h-[380px] bg-black rounded-2xl border border-[#3a494b]/30 overflow-hidden relative flex items-center justify-center shadow-2xl">
            <div ref={canvasContainerRef} className="w-full h-full flex items-center justify-center" />

            {/* Live Status Overlay Badges */}
            <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
              {(isRecordingComposed || isRecordingRawHost) && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-[10px] font-mono font-bold shadow-md animate-pulse">
                  <Circle className="w-2.5 h-2.5 fill-white shrink-0" />
                  <span>REC {formatTime(recordingSeconds)}</span>
                </div>
              )}
              <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-mono">
                1080p • 30 FPS
              </div>
            </div>
          </div>

          {/* Bottom Stream Controls Bar */}
          <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-[#3a494b]/30'
          }`}>
            {/* AV Devices Toggle Group */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleCamera}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  isCameraOn
                    ? isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-white'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isCameraOn ? <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <VideoOff className="w-3.5 h-3.5 shrink-0" />}
                <span>{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              <button
                type="button"
                onClick={toggleMic}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  isMicOn
                    ? isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-white'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <MicOff className="w-3.5 h-3.5 shrink-0" />}
                <span>{isMicOn ? 'Mic On' : 'Muted'}</span>
              </button>

              <button
                type="button"
                onClick={toggleScreenShare}
                className={`h-8 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  isScreenSharing
                    ? 'bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/50'
                    : isLight ? 'bg-slate-100 text-slate-800' : 'bg-white/10 text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span>{isScreenSharing ? 'Sharing' : 'Share Screen'}</span>
              </button>
            </div>

            {/* Audio VU Peak Meter */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <Volume2 className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
              <div className="flex-1 bg-black/20 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-75 ${
                    localAudioLevel > 65
                      ? 'bg-rose-500'
                      : localAudioLevel > 20
                        ? 'bg-emerald-400'
                        : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.max(4, localAudioLevel)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant w-7 text-right">
                {localAudioLevel}%
              </span>
            </div>

            {/* View Mode Tabs */}
            <div className={`flex rounded-lg p-0.5 border text-[10px] font-mono ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#201f21] border-[#3a494b]/40'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('virtual_studio')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                  activeTab === 'virtual_studio'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                Virtual Stream
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('recordings')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 ${
                  activeTab === 'recordings'
                    ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                <span>ISO Tracks</span>
                {recordedTracks.length > 0 && (
                  <span className="px-1 rounded bg-[#00dbe7]/30 text-[#00dbe7] font-bold text-[8px]">
                    {recordedTracks.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Studio Controls & Chat Rail (4 Columns) */}
        <div className={`lg:col-span-4 border-t lg:border-t-0 lg:border-l p-4 flex flex-col space-y-4 overflow-y-auto ${
          isLight ? 'border-slate-200 bg-white' : 'border-[#3a494b]/30 bg-[#0e0e12]'
        }`}>
          {/* Sub-tab Navigation */}
          <div className={`flex rounded-xl p-1 border text-xs font-mono ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#18181c] border-[#3a494b]/40'
          }`}>
            <button
              type="button"
              onClick={() => setSidePanelTab('presets')}
              className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                sidePanelTab === 'presets'
                  ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Presets &amp; Graphics</span>
            </button>
            <button
              type="button"
              onClick={() => setSidePanelTab('chat')}
              className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                sidePanelTab === 'chat'
                  ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Show Notes &amp; Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setSidePanelTab('participants')}
              className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                sidePanelTab === 'participants'
                  ? isLight ? 'bg-white text-slate-900 font-bold shadow-xs' : 'bg-[#00dbe7]/15 text-[#00dbe7] font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Peers ({participants.length + 1})</span>
            </button>
          </div>

          {/* TAB A: PRESETS & LOWER-THIRDS CUSTOMIZER */}
          {sidePanelTab === 'presets' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase font-bold text-on-surface flex items-center justify-between">
                  <span>Lower-Thirds Graphic Banner</span>
                  <input
                    type="checkbox"
                    checked={lowerThird.isVisible}
                    onChange={(e) => setLowerThird(prev => ({ ...prev, isVisible: e.target.checked }))}
                    className="accent-[#00dbe7] cursor-pointer"
                  />
                </label>

                {lowerThird.isVisible && (
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                        Show Title / Show Name
                      </span>
                      <input
                        type="text"
                        value={lowerThird.showTitle}
                        onChange={(e) => setLowerThird(prev => ({ ...prev, showTitle: e.target.value }))}
                        className={`w-full p-2 rounded-lg border font-mono text-xs focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                        }`}
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                        Episode Topic / Host Subtitle
                      </span>
                      <input
                        type="text"
                        value={lowerThird.subtitle}
                        onChange={(e) => setLowerThird(prev => ({ ...prev, subtitle: e.target.value }))}
                        className={`w-full p-2 rounded-lg border font-mono text-xs focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Shareable Invite Card with Code Block Standard */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#141418] border-[#3a494b]/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-on-surface">Podcast Guest Invite Link</span>
                  <button
                    type="button"
                    onClick={shareInviteLink}
                    className="text-[10px] font-mono text-[#00dbe7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {copiedKey === 'invite-link' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'invite-link' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className={`p-2.5 rounded-lg border font-mono text-[11px] select-all break-all ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a0a0c] border-white/5 text-[#e5e1e4]'
                }`}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/workspace?plugin=studiocast&room=${roomId}` : `https://www.sutharlabs.com/workspace?plugin=studiocast&room=${roomId}`}
                </div>
                <p className="text-[10px] font-mono text-on-surface-variant">
                  Guests join instantly with microphone and webcam. No software installation needed.
                </p>
              </div>
            </div>
          )}

          {/* TAB B: SHOW NOTES & REAL-TIME CHAT */}
          {sidePanelTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[360px]">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-xs font-mono text-on-surface-variant py-8">
                    No show notes or chat messages yet.
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        msg.senderId === myPeerId
                          ? isLight ? 'bg-sky-50 border-sky-200' : 'bg-[#00dbe7]/10 border-[#00dbe7]/30'
                          : isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-[#00dbe7]">{msg.senderName}</span>
                        <span className="text-on-surface-variant">{msg.timestamp}</span>
                      </div>
                      <div className="text-on-surface font-sans leading-relaxed">{msg.text}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="pt-3 border-t border-outline/15 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Post show note or message..."
                  className={`flex-1 p-2 rounded-lg border font-mono text-xs focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#121215] border-[#3a494b]/50 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  className="h-8 px-3 rounded-lg text-xs font-mono font-bold bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff] transition-all cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TAB C: PARTICIPANTS DIRECTORY */}
          {sidePanelTab === 'participants' && (
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase font-bold text-on-surface-variant">
                Broadcast Participants
              </div>

              <div className="space-y-2">
                {/* Local User */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#00dbe7]/20 border border-[#00dbe7]/40 flex items-center justify-center font-bold font-mono text-xs text-[#00dbe7]">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-on-surface">{userName} (You)</div>
                      <div className="text-[10px] font-mono text-emerald-400">Host • Active</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                    {isCameraOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                </div>

                {/* Additional Participants */}
                {participants.map(p => (
                  <div key={p.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold font-mono text-xs text-purple-400">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-on-surface">{p.name}</div>
                        <div className="text-[10px] font-mono text-on-surface-variant">{p.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ISO TRACKS & RECORDINGS LIST */}
          <div className="pt-4 border-t border-outline/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-on-surface flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-[#00dbe7] shrink-0" />
                Raw ISO &amp; Composed Tracks ({recordedTracks.length})
              </span>
            </div>

            {recordedTracks.length === 0 ? (
              <div className="p-3 rounded-lg border border-dashed border-outline/25 text-center text-[10px] font-mono text-on-surface-variant">
                No recorded tracks yet. Hit "Record Program" or "Record ISO Track" above.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {recordedTracks.map(track => (
                  <div 
                    key={track.id} 
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate text-on-surface">{track.title}</div>
                      <div className="text-[9px] text-on-surface-variant">
                        {formatBytes(track.sizeBytes)} • {formatTime(track.durationSeconds)} • {track.format.toUpperCase()}
                      </div>
                    </div>
                    <a
                      href={track.blobUrl}
                      download={`${track.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${track.id}.${track.format}`}
                      className="h-7 px-2.5 rounded bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/40 flex items-center gap-1 text-[10px] font-mono uppercase font-bold shrink-0"
                    >
                      <Download className="w-3 h-3 shrink-0" />
                      <span>Export</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zero Native Dialog Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          subtext={modalConfig.subtext}
          confirmLabel={modalConfig.confirmLabel}
          cancelLabel={modalConfig.cancelLabel}
          variant={modalConfig.variant}
          isAlert={modalConfig.isAlert}
          theme={effectiveTheme}
        />
      )}
    </div>
  );
}

