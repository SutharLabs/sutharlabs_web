# StudioCast: Sovereign Virtual Broadcast & Multi-Track Podcast Recording Engine

> **Plugin ID:** `wp_studiocast`  
> **Route:** `/workspace/podcast`  
> **Mount Endpoints:** `/api/podcast` & `/api/plugins/studiocast`  
> **Category:** Media & Podcasting  

---

## 1. Executive Summary

**StudioCast** is an enterprise-grade sovereign live broadcast and podcast recording studio inspired by **OBS Studio**, **Riverside.fm**, and **StreamYard**. It runs entirely within SutharLabs with peer-to-peer WebRTC video/audio calling, instant room link sharing, isolated raw ISO track recording & download, and a real-time HTML5 Canvas video compositor supporting 5 fixed virtual presets.

---

## 2. Core Architecture & Capabilities

### A. WebRTC Peer-to-Peer Mesh & Instant Link Sharing
* **Room Creation**: Host creates a studio session with a 4-digit sovereign code (e.g. `POD-8492`).
* **Shareable Guest Link**:
  ```
  https://www.sutharlabs.com/workspace?plugin=studiocast&room=POD-8492
  ```
  Guests join with zero account friction and zero third-party software installation.
* **Signaling Relay**:
  Lightweight Express signaling endpoints (`/api/podcast/rooms/:id/signal`) exchange SDP offers, answers, and ICE candidates to establish direct browser-to-browser WebRTC mesh connections.

### B. Real-Time Canvas Video Compositor (OBS Studio Ergonomics)
The compositor (`src/plugins/StudioCast/compositor.ts`) renders all video sources onto a master 1280x720 / 1920x1080 canvas at 30 FPS:
* **Fixed Virtual Presets**:
  1. **Side-by-Side (50/50 Split)**: Equal dual-host presentation with rounded corners, aspect fill, and active speaker border glow.
  2. **Studio Grid (2x2)**: Balanced grid for multi-person discussion panels (up to 4 active feeds).
  3. **Speaker Spotlight + PIP**: Main speaker occupies 100% of the canvas; guest webcam appears in a floating picture-in-picture box (bottom right) with drop shadow.
  4. **Broadcast Newsroom**: Dual split screen with a professional lower-thirds news ticker banner displaying Show Title, Episode Topic, and Live Timecode.
  5. **Cyberpunk Sovereign Minimal**: High-contrast dark canvas with glowing cyan telemetry borders and real-time audio spectrum visualization lines.
* **Instant Quick-Patching**:
  Clicking any preset immediately updates the canvas render loop without resetting the video stream or disconnecting peers.

### C. Multi-Track Recording & Isolated Raw ISO Track Engine
* **Composed Program Stream Recording**:
  Captures `canvas.captureStream(30)` combined with the Web Audio mixed destination track via `MediaRecorder` (`video/webm;codecs=vp9,opus`), producing a broadcast-ready program export.
* **Raw Host ISO Stream Recording**:
  Captures the host's uncompressed local camera and microphone tracks in an isolated container without graphics overlays, enabling professional NLE post-production in DaVinci Resolve or Adobe Premiere.
* **Direct Export Rail**:
  All completed takes are cataloged in the ISO Tracks table with duration, byte size, and instant one-click `.webm` / `.wav` downloads.

---

## 3. File Organization

```
src/plugins/StudioCast/
├── types.ts                         # Data contracts for rooms, peers, presets & ISO tracks
├── compositor.ts                    # HTML5 Canvas 2D live video mixing & preset engine
├── routes.ts                        # WebRTC signaling, room status & chat Express router
├── manifest.ts                      # Plugin metadata and workspace route definition
├── manifest.json                    # Plugin engine manifest descriptor
├── index.ts                         # Main module export
└── components/
    └── StudioCastView.tsx           # Full responsive virtual studio UI & controls
```

---

## 4. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/podcast/rooms` | Create a new podcast room with host token |
| `GET` | `/api/podcast/rooms/:id` | Query room status, title, active participants, and preset |
| `POST` | `/api/podcast/rooms/:id/join` | Join room with name, role (`host`, `co-host`, `guest`), and media flags |
| `POST` | `/api/podcast/rooms/:id/leave` | Leave room and notify peers |
| `POST` | `/api/podcast/rooms/:id/signal` | Send WebRTC signaling payload (SDP offer/answer, ICE candidate) |
| `GET` | `/api/podcast/rooms/:id/signal/:peerId` | Poll and consume pending signals for peer |
| `POST` | `/api/podcast/rooms/:id/preset` | Update virtual preset or lower-third banner across all participants |
| `GET` | `/api/podcast/rooms/:id/chat` | Retrieve timestamped room chat & show notes |
| `POST` | `/api/podcast/rooms/:id/chat` | Post a chat message or question |
| `POST` | `/api/podcast/rooms/:id/recordings` | Register a completed ISO recording track |
| `GET` | `/api/podcast/rooms/:id/recordings` | List all available recording tracks |

