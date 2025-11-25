import { useStore } from "zustand";
import { chatStore, type IChatState } from "./chatStore";

export const useChatStore = <T>(selector: (state: IChatState) => T) =>
  useStore(chatStore, selector);
