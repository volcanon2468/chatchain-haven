
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = () => {
    toast({
      description: "Emoji picker coming soon!",
    });
  };

  const handleAttachmentClick = () => {
    toast({
      description: "File attachments coming soon!",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="flex-shrink-0"
        onClick={handleAttachmentClick}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <div className="relative flex-1">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="min-h-[50px] max-h-[120px] py-3 pr-12 resize-none"
          disabled={isSubmitting}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 bottom-2"
          onClick={handleEmojiClick}
        >
          <Smile className="h-5 w-5" />
        </Button>
      </div>
      
      <Button
        type="submit"
        size="icon"
        className="rounded-full h-10 w-10 flex-shrink-0"
        disabled={!message.trim() || isSubmitting}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default MessageInput;
