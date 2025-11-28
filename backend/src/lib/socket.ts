import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// online users map
const userSocketMap: Record<string, Set<string>> = {};

export function getReceiverSocketId(userId: string) {
  return userSocketMap[userId] ? [...userSocketMap[userId]] : [];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  let userId: any = socket.handshake.query.userId;

  // Make sure userId is a string
  if (Array.isArray(userId)) userId = userId[0];

  console.log(userId, "check user id from backend side");

  if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
  }

  console.log(
    "userSocketMap after connect:",
    Object.fromEntries(
      Object.entries(userSocketMap).map(([k, v]) => [k, [...v]])
    )
  );

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Optional manual register
  socket.on("register", (id) => {
    if (!id) return;
    if (!userSocketMap[id]) userSocketMap[id] = new Set();
    userSocketMap[id].add(socket.id);

    console.log(`Registered user ${id} with socket ${socket.id}`);
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) delete userSocketMap[userId];
    }

    // Remove socket from any other user (if register event used)
    for (const uid of Object.keys(userSocketMap)) {
      userSocketMap[uid].delete(socket.id);
      if (userSocketMap[uid].size === 0) delete userSocketMap[uid];
    }

    console.log(
      "userSocketMap after disconnect:",
      Object.fromEntries(
        Object.entries(userSocketMap).map(([k, v]) => [k, [...v]])
      )
    );

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
