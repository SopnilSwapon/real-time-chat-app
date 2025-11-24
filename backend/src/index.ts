import express from "express";
import authRoutes from "./routes/authRoute";
import messageRoutes from "./routes/messageRoute";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();

const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);


app.listen(port, () =>{
    console.log(`Server is running @${port} port`);
    connectDB();
})