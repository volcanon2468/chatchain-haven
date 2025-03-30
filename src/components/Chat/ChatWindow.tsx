
import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/auth"; // Updated import path
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageInput from "./MessageInput";
import Message from "./Message";
import { formatTimestamp } from "./ChatList";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const ChatWindow: React.FC = () => {
  const { currentConversation, messages, isLoadingMessages, sendMessage } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Scroll to bottom when messages change or conversation changes
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, currentConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    const threshold = 100; // pixels from bottom
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // If no conversation is selected, show empty state
  if (!currentConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="bg-whatsapp/10 rounded-full p-6 inline-block mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-whatsapp"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to ChatChain Haven</h2>
          <p className="text-muted-foreground">
            Select a conversation to start chatting or add a new contact to begin.
          </p>
        </div>
      </div>
    );
  }

  const name = currentConversation.type === 'direct'
    ? currentConversation.participants[0].displayName
    : currentConversation.groupInfo?.name || 'Group Chat';

  const avatar = currentConversation.type === 'direct'
    ? currentConversation.participants[0].avatar
    : currentConversation.groupInfo?.avatar;

  const initials = getInitials(name);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Chat Header */}
      <div className="bg-white p-3 flex items-center justify-between border-b">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={avatar} />
            <AvatarFallback>
              {currentConversation.type === 'direct' ? initials : <Users className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">{name}</h2>
            {currentConversation.type === 'direct' && (
              <p className="text-xs text-muted-foreground">
                {formatLastSeen(currentConversation.participants[0].lastSeen)}
              </p>
            )}
            {currentConversation.type === 'group' && (
              <p className="text-xs text-muted-foreground">
                {currentConversation.participants.length} members
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Chat options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Search</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Clear chat</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 chat-scrollbar" onScroll={handleScroll}>
        {isLoadingMessages ? (
          <div className="flex justify-center my-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isFromCurrentUser={user?.id === message.sender}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 bg-white border-t">
        <MessageInput onSendMessage={sendMessage} />
      </div>

      {/* Scroll to bottom button (when not at bottom) */}
      {!isAtBottom && messages.length > 8 && (
        <Button
          className="absolute bottom-20 right-6 rounded-full h-10 w-10 p-0 shadow-lg"
          onClick={scrollToBottom}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>
      )}
    </div>
  );
};

const formatLastSeen = (timestamp?: number): string => {
  if (!timestamp) return "Offline";
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // If last seen within last minute
  if (diff < 60 * 1000) {
    return "Online";
  }
  
  // If last seen within last hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `Last seen ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // If last seen today
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Otherwise show date
  return `Last seen on ${new Date(timestamp).toLocaleDateString()}`;
};

export default ChatWindow;
