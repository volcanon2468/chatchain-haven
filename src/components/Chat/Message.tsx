
import React from "react";
import { Message as MessageType } from "@/services/blockchainService";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Check, Trash } from "lucide-react";
import { useAuth } from "@/context/auth";
import blockchainService from "@/services/blockchainService";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageProps {
  message: MessageType;
  isFromCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isFromCurrentUser }) => {
  const formattedTime = formatMessageTime(message.timestamp);
  const { user } = useAuth();
  
  const handleDeleteMessage = () => {
    if (user) {
      blockchainService.deleteMessage(message.id, user.id);
    }
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`
              ${isFromCurrentUser ? 'message-bubble-sent' : 'message-bubble-received'} 
              animate-message-appear
            `}
          >
            <div className="flex flex-col">
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <div className="flex items-center justify-end mt-1 space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs opacity-70 cursor-help">{formattedTime}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">IPFS Hash: {truncateHash(message.blockchainHash)}</p>
                  </TooltipContent>
                </Tooltip>
                {isFromCurrentUser && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        {message.readBy.length > 1 ? (
                          <div className="flex">
                            <Check className="h-3 w-3" />
                            <Check className="h-3 w-3 -ml-1" />
                          </div>
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {message.readBy.length > 1 
                        ? `Read by ${message.readBy.length - 1} people` 
                        : "Delivered"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDeleteMessage} className="text-destructive">
          <Trash className="h-4 w-4 mr-2" />
          Delete for me
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(message.content)} className="text-muted-foreground">
          Copy text
        </ContextMenuItem>
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(message.blockchainHash)} className="text-muted-foreground">
          Copy IPFS hash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const truncateHash = (hash: string) => {
  if (hash.length <= 12) return hash;
  return hash.slice(0, 6) + '...' + hash.slice(-6);
};

export default Message;
