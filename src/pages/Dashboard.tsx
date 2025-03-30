
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatList from "@/components/Chat/ChatList";
import ChatWindow from "@/components/Chat/ChatWindow";
import ContactList from "@/components/Chat/ContactList";
import ProfileSettings from "@/components/Chat/ProfileSettings";

const Dashboard: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ChatDashboard />} />
      <Route path="/contacts" element={<ContactsDashboard />} />
      <Route path="/profile" element={<ProfileDashboard />} />
      <Route path="/settings" element={<ProfileDashboard />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const ChatDashboard: React.FC = () => {
  return (
    <div className="flex h-full">
      <div className="w-full md:w-96 md:min-w-[360px] border-r md:max-w-sm">
        <ChatList />
      </div>
      <div className="hidden md:block flex-1">
        <ChatWindow />
      </div>
    </div>
  );
};

const ContactsDashboard: React.FC = () => {
  return (
    <div className="flex h-full">
      <div className="w-full md:w-96 md:min-w-[360px] border-r md:max-w-sm">
        <ContactList />
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="bg-primary/10 rounded-full p-6 inline-block mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold">Select a Contact</h2>
          <p className="text-muted-foreground mt-2">
            Choose a contact to view their profile or start a conversation
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileDashboard: React.FC = () => {
  return (
    <div className="flex h-full">
      <div className="w-full bg-gray-50 overflow-y-auto py-6">
        <ProfileSettings />
      </div>
    </div>
  );
};

export default Dashboard;
