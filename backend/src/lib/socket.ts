import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://real-time-chat-app-1-0-iv2t.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// -----------------------------
// MULTI-SOCKET USER MAP
// -----------------------------
const userSocketMap: Record<string, Set<string>> = {};

export function getReceiverSocketId(userId: string): string[] {
  return userSocketMap[userId] ? [...userSocketMap[userId]] : [];
}

io.on("connection", (socket) => {
  let userId = socket.handshake.query.userId as string;

  if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
  }

  console.log(`User connected: ${userId} -> ${socket.id}`);

  // -----------------------------
  // 🌟 AUDIO CALL SIGNALING
  // -----------------------------

  // Caller sends Offer
  socket.on("call-user", ({ to, offer }) => {
    const targets = getReceiverSocketId(to);
    targets.forEach((id) =>
      io.to(id).emit("incoming-call", {
        from: userId,
        offer,
      })
    );
  });

  // Receiver sends Answer
  socket.on("answer-call", ({ to, answer }) => {
    const targets = getReceiverSocketId(to);
    targets.forEach((id) => io.to(id).emit("call-answered", { answer }));
  });

  // ICE Candidates
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targets = getReceiverSocketId(to);
    targets.forEach((id) => io.to(id).emit("ice-candidate", candidate));
  });

  // Reject call
  socket.on("reject-call", ({ to }) => {
    const targets = getReceiverSocketId(to);
    targets.forEach((id) => io.to(id).emit("call-rejected"));
  });

  // End call
  socket.on("end-call", ({ to }) => {
    const targets = getReceiverSocketId(to);
    targets.forEach((id) => io.to(id).emit("call-ended"));
  });

  // -----------------------------
  // Disconnect
  // -----------------------------
  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) delete userSocketMap[userId];
    }
    console.log("User disconnected:", userId, socket.id);
  });
});

export { io, app, server };
