
import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/auth"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical, Users, RotateCcw, Trash, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import MessageInput from "./MessageInput";
import Message from "./Message";
import { formatTimestamp } from "./ChatList";
import blockchainService from "@/services/blockchainService";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const ChatWindow: React.FC = () => {
  const { currentConversation, messages, isLoadingMessages, sendMessage, refreshConversation } = useChat();
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

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
    const threshold = 100;
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

  const handleRestoreDeletedMessages = () => {
    if (user) {
      blockchainService.clearDeletedMessages(user.id);
      if (refreshConversation && currentConversation) {
        refreshConversation(currentConversation.id);
        toast({
          title: "Messages Restored",
          description: "Your deleted messages have been restored.",
        });
      }
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessages([]);
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId) 
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    if (messages.length === selectedMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(message => message.id));
    }
  };

  const handleDeleteSelected = () => {
    if (user && selectedMessages.length > 0) {
      selectedMessages.forEach(messageId => {
        blockchainService.deleteMessage(messageId, user.id);
      });
      
      toast({
        title: "Messages Deleted",
        description: `${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''} deleted for you.`,
      });
      
      setSelectedMessages([]);
      setIsSelectionMode(false);
      if (refreshConversation && currentConversation) {
        refreshConversation(currentConversation.id);
      }
    }
  };

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
          <h2 className="text-2xl font-bold mb-2">Welcome to #Chat</h2>
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
      <div className="bg-white p-3 flex items-center justify-between border-b shadow-sm">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={avatar} alt={name} />
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
        {isSelectionMode ? (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedMessages.length === messages.length ? "Deselect All" : "Select All"}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSelectionMode}
              aria-label="Cancel selection"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Chat options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View profile</DropdownMenuItem>
              <DropdownMenuItem>Search</DropdownMenuItem>
              <DropdownMenuItem onClick={toggleSelectionMode}>
                <Trash className="mr-2 h-4 w-4" />
                Delete messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRestoreDeletedMessages}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore deleted messages
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Clear chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

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
          <div className="space-y-1">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isFromCurrentUser={user?.id === message.sender}
                isSelectionMode={isSelectionMode}
                isSelected={selectedMessages.includes(message.id)}
                onSelect={toggleMessageSelection}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {isSelectionMode && selectedMessages.length > 0 && (
        <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            <span className="text-sm font-medium">{selectedMessages.length} selected</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteSelected}
            className="bg-background text-foreground hover:bg-accent"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete for me
          </Button>
        </div>
      )}

      <div className="p-3 bg-white border-t shadow-sm">
        <MessageInput onSendMessage={sendMessage} disabled={isSelectionMode} />
      </div>

      {!isAtBottom && messages.length > 8 && !isSelectionMode && (
        <Button
          className="absolute bottom-20 right-6 rounded-full h-10 w-10 p-0 shadow-lg"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
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
  
  if (diff < 60 * 1000) {
    return "Online";
  }
  
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `Last seen ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  return `Last seen on ${new Date(timestamp).toLocaleDateString()}`;
};

export default ChatWindow;
