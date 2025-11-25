import { toast } from "react-toastify";
import { createStore } from "zustand";
import { axiosInstance } from "../lib/axios";

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
  users: IChathUser[] | null;
  messages: TMessage[] | null;
  isMessagesLoading: boolean;
  isUsersLoading: boolean;
  selectedUser: IChathUser | null;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (message: TMessage) => Promise<void>;
  setSelectedUser: (selectedUser: IChathUser | null) => Promise<void>;
}

export const chatStore = createStore<IChatState>((set, get) => ({
  users: null,
  messages: null,
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

  //   todo: optimize this one later
  setSelectedUser: async (selectedUser) => set({ selectedUser }),
}));
