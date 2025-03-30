
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Database, Key } from "lucide-react";
import blockchainService from "@/services/blockchainService";
import { toast } from "@/hooks/use-toast";

const BlockchainConfig: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(!blockchainService.isDemoMode());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey || !secretKey) {
      toast({
        title: "Error",
        description: "Please enter both API Key and Secret Key",
        variant: "destructive",
      });
      return;
    }
    
    try {
      blockchainService.setApiKeys(apiKey, secretKey);
      setIsConfigured(true);
      setApiKey("");
      setSecretKey("");
      toast({
        title: "Success",
        description: "IPFS connection configured successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to configure IPFS connection",
        variant: "destructive",
      });
    }
  };

  const handleDemoMode = () => {
    toast({
      description: "Using demo mode with simulated blockchain storage",
    });
    setIsConfigured(true);
  };
  
  const clearCache = () => {
    blockchainService.clearCache();
    toast({
      description: "Message cache cleared successfully",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Blockchain Configuration
        </CardTitle>
        <CardDescription>
          Configure your IPFS connection for blockchain message storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConfigured ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                Connected
              </Badge>
              <span className="text-sm text-muted-foreground">
                Your messages are being stored on IPFS
              </span>
            </div>
            <Alert>
              <AlertDescription>
                For demo purposes, messages are cached locally but metadata is stored on IPFS.
                In a production environment, all message data would be encrypted and stored on the blockchain.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={clearCache}>
                Clear message cache
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsConfigured(false)}>
                Reconfigure
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Pinata API Key</Label>
              <Input
                id="apiKey"
                placeholder="Enter your Pinata API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secretKey">Pinata Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="Enter your Pinata Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </div>
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>
                  Sign up for a free <a href="https://app.pinata.cloud/register" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Pinata account</a> to get your API keys
                </span>
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" className="flex-1">
                Connect to IPFS
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleDemoMode}>
                Use Demo Mode
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default BlockchainConfig;
