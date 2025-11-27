import mongoose from "mongoose";
import { config } from "dotenv";

config();
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(process.env.MONGODB_URL, "CHECK URL");
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {}
};
