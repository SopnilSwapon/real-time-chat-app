import express from "express";
import authRoutes from "./routes/authRoute";
import messageRoutes from "./routes/messageRoute";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket";
import path from "path";

dotenv.config();

const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://real-time-chat-app-1-0-iv2t.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(port, () => {
  console.log(`Server is running @${port} port`);
  connectDB();
});
