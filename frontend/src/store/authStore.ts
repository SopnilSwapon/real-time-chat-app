import { createStore } from "zustand/vanilla";
import { axiosInstance } from "../lib/axios";
import type { TSignUpFormData } from "../pages/SignUpPage";
import type { TLoginFormData } from "../pages/LoginPage";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";

export interface IAuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
  createdAt: string;
}

export interface IAuthState {
  authUser: IAuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[] | null;
  socket: Socket | null;

  checkAuth: () => Promise<void>;
  signup: (data: TSignUpFormData) => Promise<void>;
  login: (data: TLoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { profilePic: string }) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const BASE_URL = "http://localhost:3000";
export const authStore = createStore<IAuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error, "check error");
      toast.error(error?.response?.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log(error, "check user error of login");
      toast.error(error.response.data.message);
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response.data.message || "Something is wrong!");
    }
  },

  updateProfile: async (data: { profilePic: string }) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, { query: { userId: authUser._id } });
    socket.connect();
    set({ socket: socket });
    // explicitly register with the server (more reliable than query in some environments)
    socket.emit("register", authUser._id);
    socket.on("getOnlineUsers", (userIds) => {
      console.log(userIds, "check user ids from client side");
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (!socket) return;
    // remove listener(s)
    socket.off("getOnlineUsers");
    try {
      socket.disconnect();
    } catch {
      // ignore
    }
    set({ socket: null, onlineUsers: [] });
  },
}));
