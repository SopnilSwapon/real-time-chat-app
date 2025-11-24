import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/userModel";
import { Request, Response, NextFunction } from "express";

interface ITokenPayload extends JwtPayload {
  userId?: string;
}

export const protectRoute = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized, no token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string
    ) as ITokenPayload;
    if (!decoded || typeof decoded === "string" || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized, invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log("Error in protectedRoute middleware", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
