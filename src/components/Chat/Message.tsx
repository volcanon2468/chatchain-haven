
import React from "react";
import { Message as MessageType } from "@/services/blockchainService";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Check, Trash, Square, CheckSquare } from "lucide-react";
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
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (messageId: string) => void;
}

const Message: React.FC<MessageProps> = ({ 
  message, 
  isFromCurrentUser, 
  isSelectionMode = false, 
  isSelected = false,
  onSelect 
}) => {
  const formattedTime = formatMessageTime(message.timestamp);
  const { user } = useAuth();
  
  const handleDeleteMessage = () => {
    if (user) {
      blockchainService.deleteMessage(message.id, user.id);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectionMode && onSelect) {
      onSelect(message.id);
    }
  };
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} my-1.5`}
          onClick={isSelectionMode ? handleSelect : undefined}
        >
          <div
            className={`
              relative
              ${isFromCurrentUser ? 'message-bubble-sent' : 'message-bubble-received'} 
              animate-message-appear
              ${isSelectionMode ? 'pl-8' : ''}
              ${isSelected ? (isFromCurrentUser ? 'bg-primary/20' : 'bg-secondary/70') : ''}
              transition-colors duration-200
            `}
          >
            {isSelectionMode && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
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
        {!isSelectionMode && (
          <>
            <ContextMenuItem onClick={handleDeleteMessage} className="text-destructive">
              <Trash className="h-4 w-4 mr-2" />
              Delete for me
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
              Copy text
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigator.clipboard.writeText(message.blockchainHash)}>
              Copy IPFS hash
            </ContextMenuItem>
          </>
        )}
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
