/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStore } from "zustand/vanilla";
import { axiosInstance } from "../lib/axios";
import type { TSignUpFormData } from "../pages/SignUpPage";
import type { TLoginFormData } from "../pages/LoginPage";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { callStore } from "./callStore";

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

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3000"
    : "https://real-time-chat-app-005.onrender.com";

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
      console.log(error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in");
      get().connectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message);
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      get().disconnectSocket();
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
      withCredentials: true,
    });

    socket.connect();
    (window as any).mainSocket = socket;

    set({ socket });
    socket.emit("register", authUser._id);

    socket.on("getOnlineUsers", (ids) => {
      set({ onlineUsers: ids });
    });

    // -------------------------
    // INCOMING CALL
    // -------------------------
    socket.on("incoming-call", async ({ from, offer }) => {
      const { receiveCall, setPeerConnection } = callStore.getState();

      receiveCall(from);

      const pc = new RTCPeerConnection({
        iceTransportPolicy: "relay", // ⭐ FORCE TURN
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:relay1.expressturn.com:3478",
            username: "efhJ8xD7v33gLrI",
            credential: "3LoD6ERk7LkqjF5p",
          },
        ],
      });

      (pc as any)._queuedCandidates = [];
      setPeerConnection(pc);

      // ❗ MUST be FIRST
      await pc.setRemoteDescription(offer);

      // NOW add microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        const audio = document.getElementById(
          "remoteAudio"
        ) as HTMLAudioElement;
        if (audio) {
          audio.srcObject = event.streams[0];
          audio.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: from,
            candidate: event.candidate,
          });
        }
      };

      // Process queued ICE
      if ((pc as any)._queuedCandidates.length > 0) {
        for (const c of (pc as any)._queuedCandidates) {
          await pc.addIceCandidate(c);
        }
        (pc as any)._queuedCandidates = [];
      }
    });

    // -------------------------
    // CALL ANSWERED
    // -------------------------
    socket.on("call-answered", async ({ answer }) => {
      const { peerConnection, stopCallerRingtone, setInCall, setCalling } =
        callStore.getState();

      stopCallerRingtone();
      setInCall(true);
      setCalling(false);

      await peerConnection?.setRemoteDescription(answer);

      if ((peerConnection as any)._queuedCandidates) {
        for (const c of (peerConnection as any)._queuedCandidates) {
          await peerConnection?.addIceCandidate(c);
        }
        (peerConnection as any)._queuedCandidates = [];
      }
    });

    // -------------------------
    // ICE CANDIDATES
    // -------------------------
    socket.on("ice-candidate", async (candidate) => {
      const { peerConnection } = callStore.getState();
      if (!peerConnection) return;

      if (
        !peerConnection.remoteDescription ||
        !peerConnection.remoteDescription.type
      ) {
        if (!(peerConnection as any)._queuedCandidates) {
          (peerConnection as any)._queuedCandidates = [];
        }
        (peerConnection as any)._queuedCandidates.push(candidate);
        return;
      }

      await peerConnection.addIceCandidate(candidate);
    });

    // -------------------------
    // CALL END
    // -------------------------
    socket.on("call-ended", () => {
      callStore.getState().endCall();
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (!socket) return;

    socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
