import { createStore } from "zustand/vanilla";
import { axiosInstance } from "../lib/axios";
import type { TSignUpFormData } from "../pages/SignUpPage";
import type { TLoginFormData } from "../pages/LoginPage";
import { toast } from "react-toastify";

export interface IAuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

export interface IAuthState {
  authUser: IAuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;

  checkAuth: () => Promise<void>;
  signup: (data: TSignUpFormData) => Promise<void>;
  login: (data: TLoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  connectSocket: () => void;
}
export const authStore = createStore<IAuthState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      console.log(res.data, "check data");
      set({ authUser: res.data });
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
      console.log(res, "check the res", res.data);
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
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response.data.message || "Something is wrong!");
    }
  },

  connectSocket: () => {
    // Placeholder: implement socket initialization here when socket utility is available
  },
}));
