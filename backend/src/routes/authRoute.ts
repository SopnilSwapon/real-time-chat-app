import express from "express";
import { login, logout, signup } from "../controllers/authController";

const router = express.Router();

router.post("/sign-up", signup)

router.post("/login", login)

router.post("/logout",logout)


export default router;