
import React, { useState } from "react";
import { useAuth, User } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CardTitle, Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Pencil, UserCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ProfileSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    displayName: user?.displayName || "",
    avatar: user?.avatar || "",
  });
  const [status, setStatus] = useState<string>(user?.status || "Hey there! I'm using ChatChain Haven");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStatus(e.target.value);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, avatar: event.target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      let avatarUrl = user.avatar;
      
      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;
        
        // Check if storage bucket exists
        const { data: bucketExists } = await supabase.storage.getBucket('avatars');
        
        // Create bucket if it doesn't exist
        if (!bucketExists) {
          await supabase.storage.createBucket('avatars', { public: true });
        }
        
        // Upload the file
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
          
        if (error) {
          throw error;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = publicUrl;
      }
      
      // Update profile with all changes
      await updateProfile({
        ...formData,
        avatar: avatarUrl,
        status
      });
      
      setIsEditing(false);
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
                  <label htmlFor="avatar-upload">
                    <Button size="icon" variant="outline" className="rounded-full h-8 w-8 bg-background cursor-pointer">
                      <Pencil className="h-4 w-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </Button>
                  </label>
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
                  onChange={handleStatusChange}
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
                    setStatus(user.status || "Hey there! I'm using ChatChain Haven");
                    setIsEditing(false);
                    setAvatarFile(null);
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
