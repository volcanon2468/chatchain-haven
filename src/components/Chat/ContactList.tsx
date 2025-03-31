
import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const ContactList: React.FC = () => {
  const { contacts, addContact, createConversation, searchUsers } = useChat();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactUsername, setNewContactUsername] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingContact, setAddingContact] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredContacts = contacts.filter(
    contact =>
      contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (newContactUsername.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchUsers(newContactUsername);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [newContactUsername, searchUsers]);

  const handleAddContact = async (username: string) => {
    if (!username.trim()) return;
    
    setAddingContact(true);
    try {
      const success = await addContact(username);
      if (success) {
        setNewContactUsername("");
        setDialogOpen(false);
      }
    } finally {
      setAddingContact(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Contacts</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <UserPlus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="relative">
                  <Input
                    placeholder="Search by username"
                    value={newContactUsername}
                    onChange={(e) => setNewContactUsername(e.target.value)}
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {searchResults.length > 0 ? (
                  <ScrollArea className="max-h-60">
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.displayName}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddContact(user.username)}
                            disabled={addingContact}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : newContactUsername.trim().length > 1 && !isSearching ? (
                  <div className="text-center py-2 text-muted-foreground">
                    <p>No users found</p>
                  </div>
                ) : null}
                
                {newContactUsername.trim() && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleAddContact(newContactUsername)} 
                      disabled={addingContact || isSearching}
                    >
                      {addingContact ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Add Contact
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3 rounded-md mb-1 flex items-center hover:bg-muted cursor-pointer"
                onClick={() => createConversation(contact.id)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{getInitials(contact.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{contact.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{contact.username}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="bg-muted rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p>No contacts found</p>
              <p className="text-sm">Add new contacts to start chatting</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactList;
