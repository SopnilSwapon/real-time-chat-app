import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Used to store online users.
const userSocketMap: { [userId: string]: Set<string> } = {};
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  let userId = socket.handshake.query.userId;

  // Normalize: ensure userId is ALWAYS a string
  if (Array.isArray(userId)) {
    userId = userId[0];
  }

  console.log(userId, "check user id from backend side");

  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);
  }

  console.log(
    "userSocketMap after connect:",
    Object.fromEntries(
      Object.entries(userSocketMap).map(([k, v]) => [k, Array.from(v)])
    )
  );

  // Support explicit register event from client
  socket.on("register", (id: string) => {
    let rid = id;
    if (Array.isArray(rid)) rid = rid[0];
    if (!rid) return;
    if (!userSocketMap[rid]) userSocketMap[rid] = new Set();
    userSocketMap[rid].add(socket.id);
    console.log(`registered user ${rid} with socket ${socket.id}`);
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Emit current online user ids
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      // if no more sockets for this user, remove the user entry
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
      }
    }

    // Also try to remove socket from any other user entries (in case register was used)
    Object.keys(userSocketMap).forEach((uid) => {
      if (userSocketMap[uid].has(socket.id)) {
        userSocketMap[uid].delete(socket.id);
        if (userSocketMap[uid].size === 0) delete userSocketMap[uid];
      }
    });

    console.log(
      "userSocketMap after disconnect:",
      Object.fromEntries(
        Object.entries(userSocketMap).map(([k, v]) => [k, Array.from(v)])
      )
    );

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
