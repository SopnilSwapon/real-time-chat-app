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

export interface IChatState {
  users: IChathUser | null;
  message: [] | null;
  isMessagesLoading: boolean;
  isUsersLoading: boolean;
  selectedUser: boolean;

  getUsers: () => Promise<void>;
}

export const chatStore = createStore<IChatState>((set) => ({
  users: null,
  message: null,
  selectedUser: false,
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
}));
