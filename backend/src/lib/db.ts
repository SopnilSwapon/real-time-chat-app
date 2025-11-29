import mongoose from "mongoose";
import { config } from "dotenv";

config();

export const connectDB = async () => {
  console.log("--------------------------------");
  console.log("🟦 DATABASE CONNECT STARTED");
  console.log("🔧 Raw MONGODB_URL =", process.env.MONGODB_URL);
  console.log("--------------------------------");

  try {
    if (!process.env.MONGODB_URL) {
      console.log("❌ ERROR: MONGODB_URL is EMPTY or UNDEFINED!");
      return;
    }

    console.log("⏳ Trying to connect to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGODB_URL);

    console.log("--------------------------------");
    console.log("✅ CONNECTED TO MONGO!");
    console.log("📌 Host:", conn.connection.host);
    console.log("📌 DB Name:", conn.connection.name);
    console.log("--------------------------------");
  } catch (error) {
    console.log("❌ MONGO CONNECTION ERROR:");
    console.log(error);
    console.log("--------------------------------");
  }
};
