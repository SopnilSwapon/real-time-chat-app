import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils/formatMessageTime";
import { useAuthStore } from "../store/useAuthStore";

export default function ChatContainer() {
  const {
    messages,
    isMessagesLoading,
    getMessages,
    selectedUser,
    subscribeToMessages,
    unSubscribeToMessages,
  } = useChatStore((state) => state);

  const { authUser } = useAuthStore((state) => state);
  const messageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getMessages(selectedUser!._id);
    subscribeToMessages();
    return () => unSubscribeToMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unSubscribeToMessages]);

  useEffect(() => {
    if (messageRef.current && messages) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      {isMessagesLoading ? (
        <MessageSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === authUser?._id ? "chat-end" : "chat-start"
              }`}
              ref={messageRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser?._id
                        ? authUser?.profilePic || "/avatar.png"
                        : selectedUser?.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt!)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <MessageInput />
    </div>
  );
}
