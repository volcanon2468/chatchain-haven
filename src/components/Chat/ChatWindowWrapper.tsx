
import React, { useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import ChatWindow from "./ChatWindow";

interface ChatWindowWrapperProps {
  conversationId?: string;
}

const ChatWindowWrapper: React.FC<ChatWindowWrapperProps> = ({ conversationId }) => {
  const { conversations, selectConversation, currentConversation } = useChat();
  
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation]);

  if (!currentConversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="bg-primary/10 rounded-full p-6 inline-block mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="m3 3 3 9-3 9 19-9-19-9Z" />
              <path d="M13 13h8" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Select a Conversation</h2>
          <p className="text-muted-foreground mt-2">
            Choose a conversation or start a new one to begin chatting
          </p>
        </div>
      </div>
    );
  }

  return <ChatWindow />;
};

export default ChatWindowWrapper;
