
import React, { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ContactList: React.FC = () => {
  const { contacts, addContact, createConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [newContactUsername, setNewContactUsername] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  const filteredContacts = contacts.filter(
    contact =>
      contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Dialog>
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
