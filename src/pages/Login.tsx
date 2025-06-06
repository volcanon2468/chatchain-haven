
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import LoginForm from "@/components/Auth/LoginForm";

const Login: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="text-3xl font-bold text-whatsapp mb-2">
          #Chat
        </h1>
        <p className="text-muted-foreground">
          Secure messaging powered by blockchain technology
        </p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;
