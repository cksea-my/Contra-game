import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";

interface NetworkPlayer {
  id: string;
  name: string;
  character: "bill" | "lance";
  x: number;
  y: number;
  vx: number;
  vy: number;
  aimAngle: number;
  state: "idle" | "run" | "jump" | "prone" | "swim" | "dead";
  facingLeft: boolean;
  lives: number;
  score: number;
  weapon: "NORMAL" | "MACHINE_GUN" | "SPREAD" | "LASER" | "FIRE" | "BARRIER";
  invincibleTime: number;
  isFiring: boolean;
  ping: number;
}

interface Room {
  id: string;
  name: string;
  mode: "coop" | "versus";
  maxPlayers: number;
  hostId: string;
  players: Map<string, NetworkPlayer>;
  clients: Map<string, WebSocket>;
  stageStarted: boolean;
  bossState: {
    spawned: boolean;
    hp: number;
    maxHp: number;
    defeated: boolean;
    phase: number;
  };
  seed: number;
  createdAt: number;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Active game rooms
const rooms = new Map<string, Room>();

// REST API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeRooms: rooms.size, timestamp: Date.now() });
});

app.get("/api/rooms", (req, res) => {
  const list = Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    mode: r.mode,
    playerCount: r.players.size,
    maxPlayers: r.maxPlayers,
    stageStarted: r.stageStarted,
    createdAt: r.createdAt,
  }));
  res.json(list);
});

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  function broadcastToRoom(room: Room, message: object, excludeId?: string) {
    const data = JSON.stringify(message);
    room.clients.forEach((ws, playerId) => {
      if (playerId !== excludeId && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "PING": {
            ws.send(JSON.stringify({ type: "PONG", clientTimestamp: msg.clientTimestamp, serverTimestamp: Date.now() }));
            break;
          }

          case "CREATE_ROOM": {
            const roomId = msg.roomId || Math.random().toString(36).substring(2, 7).toUpperCase();
            const playerId = msg.playerId || Math.random().toString(36).substring(2, 9);
            const playerChar = msg.character || "bill";

            const newPlayer: NetworkPlayer = {
              id: playerId,
              name: msg.playerName || `P1_${playerChar.toUpperCase()}`,
              character: playerChar,
              x: 80,
              y: 280,
              vx: 0,
              vy: 0,
              aimAngle: 0,
              state: "idle",
              facingLeft: false,
              lives: 3,
              score: 0,
              weapon: "NORMAL",
              invincibleTime: 120,
              isFiring: false,
              ping: 0,
            };

            const room: Room = {
              id: roomId,
              name: msg.roomName || `ARCADE-${roomId}`,
              mode: msg.mode || "coop",
              maxPlayers: msg.maxPlayers || 2,
              hostId: playerId,
              players: new Map([[playerId, newPlayer]]),
              clients: new Map([[playerId, ws]]),
              stageStarted: false,
              bossState: {
                spawned: false,
                hp: 1000,
                maxHp: 1000,
                defeated: false,
                phase: 1,
              },
              seed: Math.floor(Math.random() * 100000),
              createdAt: Date.now(),
            };

            rooms.set(roomId, room);
            currentRoomId = roomId;
            currentPlayerId = playerId;

            ws.send(
              JSON.stringify({
                type: "ROOM_CREATED",
                roomId,
                playerId,
                room: {
                  id: room.id,
                  name: room.name,
                  mode: room.mode,
                  seed: room.seed,
                  hostId: room.hostId,
                  players: Array.from(room.players.values()),
                },
              })
            );
            break;
          }

          case "JOIN_ROOM": {
            const targetRoomId = (msg.roomId || "").trim().toUpperCase();
            const room = rooms.get(targetRoomId);

            if (!room) {
              ws.send(JSON.stringify({ type: "ERROR", message: `Room ${targetRoomId} not found.` }));
              return;
            }

            if (room.players.size >= room.maxPlayers) {
              ws.send(JSON.stringify({ type: "ERROR", message: "Room is full (max 2 players)." }));
              return;
            }

            const playerId = msg.playerId || Math.random().toString(36).substring(2, 9);
            // Default to Lance if Bill is taken
            const existingChars = Array.from(room.players.values()).map((p) => p.character);
            const assignedChar: "bill" | "lance" = existingChars.includes("bill") ? "lance" : "bill";

            const newPlayer: NetworkPlayer = {
              id: playerId,
              name: msg.playerName || (assignedChar === "lance" ? "P2_LANCE" : "P1_BILL"),
              character: assignedChar,
              x: 120,
              y: 280,
              vx: 0,
              vy: 0,
              aimAngle: 0,
              state: "idle",
              facingLeft: false,
              lives: 3,
              score: 0,
              weapon: "NORMAL",
              invincibleTime: 120,
              isFiring: false,
              ping: 0,
            };

            room.players.set(playerId, newPlayer);
            room.clients.set(playerId, ws);
            currentRoomId = targetRoomId;
            currentPlayerId = playerId;

            // Notify joining client
            ws.send(
              JSON.stringify({
                type: "ROOM_JOINED",
                roomId: room.id,
                playerId,
                room: {
                  id: room.id,
                  name: room.name,
                  mode: room.mode,
                  seed: room.seed,
                  hostId: room.hostId,
                  stageStarted: room.stageStarted,
                  bossState: room.bossState,
                  players: Array.from(room.players.values()),
                },
              })
            );

            // Notify existing room members
            broadcastToRoom(
              room,
              {
                type: "PLAYER_JOINED",
                player: newPlayer,
                players: Array.from(room.players.values()),
              },
              playerId
            );
            break;
          }

          case "START_GAME": {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || room.hostId !== currentPlayerId) return;

            room.stageStarted = true;
            broadcastToRoom(room, {
              type: "GAME_STARTED",
              seed: room.seed,
            });
            break;
          }

          case "PLAYER_SYNC": {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const player = room.players.get(currentPlayerId);
            if (!player) return;

            // Update player state on server
            Object.assign(player, {
              x: msg.x,
              y: msg.y,
              vx: msg.vx,
              vy: msg.vy,
              aimAngle: msg.aimAngle,
              state: msg.state,
              facingLeft: msg.facingLeft,
              lives: msg.lives,
              score: msg.score,
              weapon: msg.weapon,
              invincibleTime: msg.invincibleTime,
              isFiring: msg.isFiring,
              ping: msg.ping || player.ping,
            });

            // Broadcast to other peers
            broadcastToRoom(
              room,
              {
                type: "PLAYER_SYNC_UPDATE",
                playerId: currentPlayerId,
                data: msg,
              },
              currentPlayerId
            );
            break;
          }

          case "PLAYER_FIRE": {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            broadcastToRoom(
              room,
              {
                type: "PLAYER_FIRED_BULLET",
                playerId: currentPlayerId,
                bullet: msg.bullet,
              },
              currentPlayerId
            );
            break;
          }

          case "ENEMY_HIT": {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            broadcastToRoom(
              room,
              {
                type: "ENEMY_HIT_EVENT",
                enemyId: msg.enemyId,
                damage: msg.damage,
                shooterId: currentPlayerId,
                killed: msg.killed,
              },
              currentPlayerId
            );
            break;
          }

          case "BOSS_HIT": {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            room.bossState.hp = Math.max(0, room.bossState.hp - (msg.damage || 10));
            if (room.bossState.hp <= 0) {
              room.bossState.defeated = true;
            }

            broadcastToRoom(room, {
              type: "BOSS_UPDATE",
              hp: room.bossState.hp,
              maxHp: room.bossState.maxHp,
              defeated: room.bossState.defeated,
              hitterId: currentPlayerId,
            });
            break;
          }

          case "POWERUP_TAKEN": {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            broadcastToRoom(
              room,
              {
                type: "POWERUP_COLLECTED",
                powerupId: msg.powerupId,
                collectorId: currentPlayerId,
                weapon: msg.weapon,
              },
              currentPlayerId
            );
            break;
          }

          case "ARCADE_TAUNT": {
            if (!currentRoomId || !currentPlayerId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const p = room.players.get(currentPlayerId);
            broadcastToRoom(room, {
              type: "TAUNT_MESSAGE",
              playerId: currentPlayerId,
              playerName: p ? p.name : "Player",
              text: msg.text,
            });
            break;
          }
        }
      } catch (e) {
        console.error("WS error parsing message:", e);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players.delete(currentPlayerId);
          room.clients.delete(currentPlayerId);

          if (room.players.size === 0) {
            rooms.delete(currentRoomId);
          } else {
            // Assign new host if host left
            if (room.hostId === currentPlayerId) {
              const nextHost = room.players.keys().next().value;
              if (nextHost) room.hostId = nextHost;
            }
            broadcastToRoom(room, {
              type: "PLAYER_LEFT",
              playerId: currentPlayerId,
              newHostId: room.hostId,
              players: Array.from(room.players.values()),
            });
          }
        }
      }
    });
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Retro Contra Arcade Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
