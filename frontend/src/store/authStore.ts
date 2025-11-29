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
      console.log(error, "check auth error");
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

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
      withCredentials: true,
    });

    socket.connect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).mainSocket = socket; // IMPORTANT
    set({ socket });

    socket.emit("register", authUser._id);

    socket.on("getOnlineUsers", (ids) => {
      set({ onlineUsers: ids });
    });

    // -----------------------
    // 📞 AUDIO CALL LISTENERS
    // -----------------------

    // Incoming call offer
    // socket.on("incoming-call", async ({ from, offer }) => {
    //   console.log("📞 Incoming call from", from);
    //   const { setIncomingCall, setCallerId, setPeerConnection } =
    //     callStore.getState();

    //   const pc = new RTCPeerConnection({
    //     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    //   });

    //   // Set global peer connection
    //   setPeerConnection(pc);

    //   // Save call details
    //   setIncomingCall(true);
    //   setCallerId(from);

    //   // Get microphone stream
    //   const stream = await navigator.mediaDevices.getUserMedia({
    //     audio: true,
    //   });
    //   stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    //   // Incoming remote audio
    //   pc.ontrack = (event) => {
    //     const audio = document.getElementById(
    //       "remoteAudio"
    //     ) as HTMLAudioElement;
    //     audio.srcObject = event.streams[0];
    //     audio.play();
    //   };

    //   pc.onicecandidate = (event) => {
    //     if (event.candidate) {
    //       socket.emit("ice-candidate", {
    //         to: from,
    //         candidate: event.candidate,
    //       });
    //     }
    //   };

    //   await pc.setRemoteDescription(offer);
    // });
    socket.on("incoming-call", async ({ from, offer }) => {
      console.log("📞 Incoming call from", from);

      const { receiveCall, setPeerConnection } = callStore.getState();

      // UI + ringtone
      receiveCall(from);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // storage for early ICE candidates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pc as any)._queuedCandidates = [];

      setPeerConnection(pc);

      // Add microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Remote audio handler
      pc.ontrack = (event) => {
        const audio = document.getElementById(
          "remoteAudio"
        ) as HTMLAudioElement | null;
        if (audio) {
          audio.srcObject = event.streams[0];
          audio.play().catch(() => {}); // prevent autoplay crash
        }
      };

      // ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: from,
            candidate: event.candidate,
          });
        }
      };

      // --- Set remote offer ---
      await pc.setRemoteDescription(offer);

      // ---- Process queued candidates ----
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((pc as any)._queuedCandidates.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const c of (pc as any)._queuedCandidates) {
          await pc.addIceCandidate(c).catch(console.error);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pc as any)._queuedCandidates = [];
      }
    });

    // When receiver accepts → caller receives answer
    socket.on("call-answered", async ({ answer }) => {
      const { peerConnection } = callStore.getState();
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    });

    // ICE candidate handling
    socket.on("ice-candidate", async (candidate) => {
      const { peerConnection } = callStore.getState();
      if (!peerConnection) return;

      if (!peerConnection.remoteDescription) {
        console.log("🕒 ICE queued (remoteDescription missing)");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(peerConnection as any)._queuedCandidates) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (peerConnection as any)._queuedCandidates = [];
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (peerConnection as any)._queuedCandidates.push(candidate);
        return;
      }

      await peerConnection.addIceCandidate(candidate).catch(console.error);
    });

    // Call ended
    socket.on("call-ended", () => {
      callStore.getState().endCall();
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
