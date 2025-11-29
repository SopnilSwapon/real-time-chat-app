import { toast } from "react-toastify";
import { createStore } from "zustand";
import { axiosInstance } from "../lib/axios";
import { authStore } from "./authStore";

export interface IChathUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
  createdAt: string;
}

export type TMessage = {
  _id?: string;
  text?: string;
  image?: string;
  createdAt?: Date | undefined;
  senderId?: string;
};
export interface IChatState {
  messages: TMessage[] | null;
  users: IChathUser[] | null;
  isMessagesLoading: boolean;
  isUsersLoading: boolean;
  selectedUser: IChathUser | null;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (message: TMessage) => Promise<void>;
  subscribeToMessages: () => void;
  unSubscribeToMessages: () => void;
  setSelectedUser: (selectedUser: IChathUser | null) => Promise<void>;
}

export const chatStore = createStore<IChatState>((set, get) => ({
  messages: null,
  users: null,
  selectedUser: null,
  isMessagesLoading: false,
  isUsersLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser?._id}`,
        messageData
      );
      set({ messages: [...(messages ?? []), res.data] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = authStore.getState().socket;
    socket?.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({
        messages: [...get().messages!, newMessage],
      });
    });
  },
  unSubscribeToMessages: () => {
    const socket = authStore.getState().socket;
    socket?.off("newMessage");
  },

  setSelectedUser: async (selectedUser) => set({ selectedUser }),
}));
