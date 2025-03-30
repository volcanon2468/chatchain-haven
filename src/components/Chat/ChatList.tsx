
import React, { useState } from "react";
import { useChat, Conversation } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, UserPlus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ChatList: React.FC = () => {
  const { conversations, selectConversation, currentConversation, contacts, addContact } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactUsername, setNewContactUsername] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  const filteredConversations = conversations.filter(
    conversation =>
      conversation.type === "direct"
        ? conversation.participants[0].displayName.toLowerCase().includes(searchQuery.toLowerCase())
        : conversation.groupInfo?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = async () => {
    if (!newContactUsername.trim()) return;
    
    setAddingContact(true);
    try {
      await addContact(newContactUsername);
      setNewContactUsername("");
    } finally {
      setAddingContact(false);
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Check if the message is from today
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if the message is from yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // For older messages, show the date
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full border-r bg-white">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter username"
                    value={newContactUsername}
                    onChange={(e) => setNewContactUsername(e.target.value)}
                  />
                  <Button onClick={handleAddContact} disabled={!newContactUsername.trim() || addingContact}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-3">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversation?.id === conversation.id}
                onClick={() => selectConversation(conversation.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="bg-muted rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                <MessageSquareIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p>No conversations found</p>
              <p className="text-sm">Start a new chat or search with different terms</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onClick 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const name = conversation.type === 'direct' 
    ? conversation.participants[0].displayName 
    : conversation.groupInfo?.name || 'Group Chat';
    
  const avatar = conversation.type === 'direct'
    ? conversation.participants[0].avatar
    : conversation.groupInfo?.avatar;
    
  const initials = getInitials(name);

  const lastMessage = conversation.lastMessage ? (
    <span className="text-muted-foreground text-sm truncate">
      {conversation.lastMessage.content}
    </span>
  ) : (
    <span className="text-muted-foreground text-sm italic">No messages yet</span>
  );

  const timeStamp = formatTimestamp(conversation.lastMessage?.timestamp);

  return (
    <div
      className={`p-3 rounded-md mb-1 flex items-center cursor-pointer relative ${
        isActive ? "bg-accent" : "hover:bg-muted"
      }`}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12 mr-3">
        <AvatarImage src={avatar} />
        <AvatarFallback>
          {conversation.type === 'direct' ? initials : <Users className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <h3 className="font-medium truncate">{name}</h3>
          <span className="text-xs text-muted-foreground">{timeStamp}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="max-w-[80%] truncate">
            {lastMessage}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="bg-whatsapp text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {conversation.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
};

export const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // Check if the message is from today
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Check if the message is from yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // For older messages, show the date
  return date.toLocaleDateString();
};

export default ChatList;
