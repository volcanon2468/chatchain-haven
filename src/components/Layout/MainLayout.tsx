
import React, { useState, ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatProvider } from "@/context/ChatContext";
import SidebarContent from "./SidebarContent";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const { user, userInitials, logout } = useRequireAuth();

  // If not authenticated, useRequireAuth will redirect to login
  if (!user) return null;

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
