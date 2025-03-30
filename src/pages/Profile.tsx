
import React from "react";
import ProfileSettings from "@/components/Chat/ProfileSettings";
import BlockchainConfig from "@/components/Chat/BlockchainConfig";

const Profile: React.FC = () => {
  return (
    <div className="flex h-full">
      <div className="w-full bg-gray-50 overflow-y-auto py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <ProfileSettings />
          <BlockchainConfig />
        </div>
      </div>
    </div>
  );
};

export default Profile;
