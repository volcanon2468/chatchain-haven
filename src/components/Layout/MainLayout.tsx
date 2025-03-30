
import React, { useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatProvider } from "@/context/ChatContext";
import SidebarContent from "./SidebarContent";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!user) {
    navigate("/login");
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userInitials = getInitials(user.displayName);

  return (
    <ChatProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden absolute left-2 top-2 z-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-sidebar">
            <SidebarContent 
              user={user} 
              userInitials={userInitials} 
              logout={logout}
              onClose={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col bg-sidebar">
          <SidebarContent 
            user={user} 
            userInitials={userInitials} 
            logout={logout}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          {children}
        </div>
      </div>
    </ChatProvider>
  );
};

export default MainLayout;
