
import React from "react";
import { Message as MessageType } from "@/services/blockchainService";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Check } from "lucide-react";

interface MessageProps {
  message: MessageType;
  isFromCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isFromCurrentUser }) => {
  const formattedTime = formatMessageTime(message.timestamp);
  
  return (
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
            <span className="text-xs opacity-70">{formattedTime}</span>
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
  );
};

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default Message;
