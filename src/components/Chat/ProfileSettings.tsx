
import React, { useState } from "react";
import { useAuth, User } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CardTitle, Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Pencil, UserCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ProfileSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    displayName: user?.displayName || "",
    avatar: user?.avatar || "",
  });
  const [status, setStatus] = useState<string>("Hey there! I'm using ChatChain Haven");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // In a real app, you'd upload the avatar here if it's a file
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader className="text-center">
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={formData.avatar} />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.displayName || user.displayName)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-4 right-0">
                  <Button size="icon" variant="outline" className="rounded-full h-8 w-8 bg-background">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <h3 className="font-medium text-lg">{formData.displayName || user.displayName}</h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="Your display name"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Textarea
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your status message"
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="walletAddress">Wallet Address</Label>
                <Input
                  id="walletAddress"
                  value={user.walletAddress}
                  disabled
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {isEditing ? (
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFormData({
                      displayName: user.displayName,
                      avatar: user.avatar,
                    });
                    setIsEditing(false);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full mt-6"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-center text-xs text-muted-foreground border-t pt-4">
          <div>
            <p>Account created via ChatChain Haven</p>
            <p className="mt-1">All messages stored securely on blockchain</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileSettings;
