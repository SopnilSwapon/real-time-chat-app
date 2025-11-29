import { create } from "zustand";

export type TCallState = {
  isCalling: boolean;
  incomingCall: boolean;
  callerId: string | null;
  peerConnection: RTCPeerConnection | null;

  startCall: (receiverId: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
};

export const callStore = create<TCallState>((set, get) => ({
  isCalling: false,
  incomingCall: false,
  callerId: null,
  peerConnection: null,

  startCall: async (receiverId) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (window as any).mainSocket;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    set({ peerConnection: pc, isCalling: true });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: receiverId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const audio = document.getElementById("remoteAudio") as HTMLAudioElement;
      audio.srcObject = e.streams[0];
      audio.play();
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-user", { to: receiverId, offer });
  },

  acceptCall: async () => {
    const { callerId, peerConnection } = get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (window as any).mainSocket;

    const pc = peerConnection!;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer-call", { to: callerId, answer });

    set({ incomingCall: false, isCalling: true });
  },

  rejectCall: () => {
    const { callerId } = get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (window as any).mainSocket;

    socket.emit("end-call", { to: callerId });
    set({ incomingCall: false, callerId: null });
  },

  endCall: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (window as any).mainSocket;
    const { callerId, peerConnection } = get();

    peerConnection?.close();

    socket.emit("end-call", { to: callerId });

    set({
      isCalling: false,
      incomingCall: false,
      callerId: null,
      peerConnection: null,
    });
  },
}));
