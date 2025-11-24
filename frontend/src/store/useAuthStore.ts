
import { useStore } from "zustand";
import { authStore, type AuthState } from "./authStore";

export const useAuthStore = <T>(selector: (state: AuthState) => T) =>
  useStore(authStore, selector);
