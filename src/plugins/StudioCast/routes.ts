import { Router, Request, Response } from "express";
import { StudioCastRoom, StudioCastParticipant, StudioCastChatMessage, SignalMessage, IsoRecordingTrack } from "./types.js";

// In-memory state with fast thread-safe lookups
const roomsStore = new Map<string, StudioCastRoom>();
const signalQueue = new Map<string, SignalMessage[]>(); // peerId -> pending signals
const chatStore = new Map<string, StudioCastChatMessage[]>(); // roomId -> messages
const recordingsStore = new Map<string, IsoRecordingTrack[]>(); // roomId -> tracks

// Helper to seed a default room if empty
function getOrCreateRoom(roomId: string, title?: string, hostName?: string): StudioCastRoom {
  let room = roomsStore.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      title: title || `Sovereign Podcast #${roomId}`,
      hostId: `host_${Date.now()}`,
      hostName: hostName || 'Host',
      preset: 'split',
      lowerThird: {
        showTitle: title || 'SutharLabs Sovereign Studio',
        subtitle: 'Live Multi-Track Podcast Broadcast',
        topicTicker: 'SOVEREIGN CLOUD • WEBRTC MESH • RAW ISO TRACKS',
        isVisible: true,
        accentColor: '#00dbe7'
      },
      isRecording: false,
      createdAt: new Date().toISOString(),
      participants: []
    };
    roomsStore.set(roomId, room);
    chatStore.set(roomId, [
      {
        id: `sys_${Date.now()}`,
        senderId: 'system',
        senderName: 'Studio Engine',
        role: 'host',
        text: 'Welcome to StudioCast! Share this room link with your guests to connect over zero-latency WebRTC.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }
  return room;
}

export function registerRoutes(router: Router) {
  // POST /rooms - Create a new podcast room
  router.post("/rooms", (req: Request, res: Response) => {
    try {
      const { title, hostName, preset } = req.body;
      const roomId = `POD-${Math.floor(1000 + Math.random() * 9000)}`;
      const room = getOrCreateRoom(roomId, title, hostName);
      if (preset) room.preset = preset;

      return res.json({
        success: true,
        roomId: room.id,
        room
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to create room", details: err.message });
    }
  });

  // GET /rooms/:id - Query room state
  router.get("/rooms/:id", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const room = roomsStore.get(roomId);
    if (!room) {
      return res.status(404).json({ error: `Podcast room "${roomId}" not found.` });
    }
    return res.json({ success: true, room });
  });

  // POST /rooms/:id/join - Join room as participant
  router.post("/rooms/:id/join", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const { participantId, name, role = 'guest', hasVideo = true, hasAudio = true } = req.body;

    if (!participantId || !name) {
      return res.status(400).json({ error: "participantId and name are required." });
    }

    const room = getOrCreateRoom(roomId);
    const existingIdx = room.participants.findIndex(p => p.id === participantId);

    const participant: StudioCastParticipant = {
      id: participantId,
      name,
      role: (role as any) || (room.participants.length === 0 ? 'host' : 'guest'),
      hasAudio,
      hasVideo,
      isScreenSharing: false,
      joinedAt: new Date().toISOString(),
      audioLevel: 0
    };

    if (existingIdx >= 0) {
      room.participants[existingIdx] = participant;
    } else {
      room.participants.push(participant);
    }

    // Add system join message to chat
    const msgs = chatStore.get(roomId) || [];
    msgs.push({
      id: `join_${Date.now()}_${Math.random()}`,
      senderId: 'system',
      senderName: 'Studio Engine',
      role: 'guest',
      text: `${name} joined the broadcast as ${participant.role}.`,
      timestamp: new Date().toLocaleTimeString()
    });
    chatStore.set(roomId, msgs);

    return res.json({ success: true, participant, room });
  });

  // POST /rooms/:id/leave - Leave room
  router.post("/rooms/:id/leave", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const { participantId } = req.body;
    const room = roomsStore.get(roomId);
    if (room && participantId) {
      const leaving = room.participants.find(p => p.id === participantId);
      room.participants = room.participants.filter(p => p.id !== participantId);
      if (leaving) {
        const msgs = chatStore.get(roomId) || [];
        msgs.push({
          id: `leave_${Date.now()}`,
          senderId: 'system',
          senderName: 'Studio Engine',
          role: 'guest',
          text: `${leaving.name} left the broadcast.`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
    return res.json({ success: true });
  });

  // POST /rooms/:id/preset - Update virtual preset or lower thirds
  router.post("/rooms/:id/preset", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const { preset, lowerThird } = req.body;
    const room = roomsStore.get(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (preset) room.preset = preset;
    if (lowerThird) room.lowerThird = { ...room.lowerThird, ...lowerThird };

    return res.json({ success: true, room });
  });

  // POST /rooms/:id/signal - WebRTC Signaling relay (offers, answers, ICE)
  router.post("/rooms/:id/signal", (req: Request, res: Response) => {
    const { fromId, fromName, toId, type, payload } = req.body;
    if (!fromId || !toId || !type) {
      return res.status(400).json({ error: "Missing signaling fields (fromId, toId, type)." });
    }

    const signal: SignalMessage = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fromId,
      fromName: fromName || 'Peer',
      toId,
      type,
      payload,
      timestamp: Date.now()
    };

    const targetQueue = signalQueue.get(toId) || [];
    targetQueue.push(signal);
    signalQueue.set(toId, targetQueue);

    return res.json({ success: true, signalId: signal.id });
  });

  // GET /rooms/:id/signal/:peerId - Retrieve pending signals for peer
  router.get("/rooms/:id/signal/:peerId", (req: Request, res: Response) => {
    const peerId = req.params.peerId;
    const queue = signalQueue.get(peerId) || [];
    // Clear queue after consuming
    signalQueue.set(peerId, []);
    return res.json({ success: true, signals: queue });
  });

  // GET /rooms/:id/chat - Retrieve chat history
  router.get("/rooms/:id/chat", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const msgs = chatStore.get(roomId) || [];
    return res.json({ success: true, messages: msgs });
  });

  // POST /rooms/:id/chat - Send room message
  router.post("/rooms/:id/chat", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const { senderId, senderName, role, text, isQuestion } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text cannot be empty." });
    }

    const message: StudioCastChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: senderId || 'anon',
      senderName: senderName || 'Anonymous',
      role: role || 'guest',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isQuestion: Boolean(isQuestion)
    };

    const msgs = chatStore.get(roomId) || [];
    msgs.push(message);
    chatStore.set(roomId, msgs);

    return res.json({ success: true, message });
  });

  // POST /rooms/:id/recordings - Register an ISO recording track
  router.post("/rooms/:id/recordings", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const { title, participantName, type, format, durationSeconds, sizeBytes, blobUrl } = req.body;

    const track: IsoRecordingTrack = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title || 'Podcast Recording Track',
      participantName: participantName || 'Host',
      type: type || 'composed_virtual',
      format: format || 'webm',
      durationSeconds: Number(durationSeconds) || 0,
      sizeBytes: Number(sizeBytes) || 0,
      blobUrl: blobUrl || '',
      createdAt: new Date().toISOString()
    };

    const tracks = recordingsStore.get(roomId) || [];
    tracks.push(track);
    recordingsStore.set(roomId, tracks);

    return res.json({ success: true, track });
  });

  // GET /rooms/:id/recordings - List recorded ISO tracks
  router.get("/rooms/:id/recordings", (req: Request, res: Response) => {
    const roomId = req.params.id;
    const tracks = recordingsStore.get(roomId) || [];
    return res.json({ success: true, tracks });
  });
}

