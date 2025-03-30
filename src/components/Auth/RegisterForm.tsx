
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { User, LockIcon, UserCircle, Mail } from "lucide-react";

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password || !displayName) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await register(username, email, password, displayName);
      if (success) {
        navigate("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-whatsapp flex items-center justify-center mb-4">
          <UserCircle className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Enter your details to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="displayName"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10"
                autoComplete="name"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !username || !email || !password || !displayName}
          >
            {isSubmitting ? "Creating Account..." : "Register"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 border-t pt-4">
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
        <p className="text-xs text-muted-foreground text-center">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
