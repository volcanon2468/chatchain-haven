
import React from "react";
import ProfileSettings from "@/components/Chat/ProfileSettings";

const Profile: React.FC = () => {
  return (
    <div className="flex h-full">
      <div className="w-full bg-gray-50 overflow-y-auto py-6">
        <ProfileSettings />
      </div>
    </div>
  );
};

export default Profile;
