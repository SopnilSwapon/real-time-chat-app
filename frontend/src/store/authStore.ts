import { createStore } from "zustand/vanilla";
import { axiosInstance } from "../lib/axios";

export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

export interface AuthState {
  authUser: AuthUser | null;

  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;

  checkAuth: () => Promise<void>;
}

export const authStore = createStore<AuthState>((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

  checkAuth: async () => {
   try {
            
            const res = await axiosInstance.get("/auth/check");
            set({authUser: res.data})
        } catch (error) {
            console.log("Error in checkAuth", error)
        } finally{
            set({isCheckingAuth: false})
        }
  },
}));
