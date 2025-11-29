import { useStore } from "zustand";
import { callStore, type TCallState } from "./callStore";

export const useCallStore = <T>(selector: (state: TCallState) => T) =>
  useStore(callStore, selector);
