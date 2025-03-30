
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, 
  User as UserIcon, 
  MessageSquare,
  Users,
  Settings,
  HelpCircle,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarContentProps {
  user: {
    displayName: string;
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  userInitials: string;
  logout: () => void;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  user, 
  userInitials, 
  logout,
  onClose 
}) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-whatsapp text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 bg-white/20">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback className="bg-white/20 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.displayName}</span>
              <span className="text-xs opacity-80">@{user.username}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigation("/dashboard/profile")}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 p-2 space-y-1 overflow-y-auto">
        <Button 
          variant="ghost" 
          className="justify-start"
          onClick={() => handleNavigation("/dashboard")}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Chats
        </Button>
        <Button 
          variant="ghost" 
          className="justify-start"
          onClick={() => handleNavigation("/dashboard/contacts")}
        >
          <Users className="mr-2 h-5 w-5" />
          Contacts
        </Button>
        <Button 
          variant="ghost" 
          className="justify-start"
          onClick={() => handleNavigation("/dashboard/settings")}
        >
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
      </nav>

      {/* Wallet display */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-md p-3">
          <p className="text-xs font-medium mb-1">Blockchain Wallet</p>
          <p className="text-xs truncate text-muted-foreground">
            {user.walletAddress}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border flex justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs"
          onClick={() => handleNavigation("/help")}
        >
          <HelpCircle className="h-4 w-4 mr-1" />
          Help
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-destructive hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;
