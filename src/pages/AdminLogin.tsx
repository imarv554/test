import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

// Mock admin credentials - in production, this would be handled by a secure backend
const ADMIN_CREDENTIALS = {
  username: 'admin@credify.com',
  password: 'SecureAdmin2024!'
};

export default function AdminLogin({ onLoginSuccess, onNavigateHome }: AdminLoginProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (formData.username === ADMIN_CREDENTIALS.username && 
        formData.password === ADMIN_CREDENTIALS.password) {
      
      // Store admin session (in production, use secure tokens)
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_login_time', Date.now().toString());
      
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-6"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CREDIFY</span>
          </button>
          <h1 className="text-xl font-semibold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400">Secure access for authorized personnel only</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Administrator Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Email Address</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="admin@credify.com"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <p className="text-xs font-medium text-slate-300 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-slate-400">
                <div>Email: admin@credify.com</div>
                <div>Password: SecureAdmin2024!</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            All access attempts are logged and monitored for security purposes
          </p>
        </div>
      </div>
    </div>
  );
}