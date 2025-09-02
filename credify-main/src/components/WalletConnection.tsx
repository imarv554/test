import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, CheckCircle, AlertTriangle, Copy, ExternalLink, Shield } from "lucide-react";
import { useConcordium } from "@/contexts/ConcordiumContext";

interface WalletConnectionProps {
  variant?: "button" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showAddress?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WalletConnectionErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Wallet connection error: {this.state.error?.message || "Unknown error"}
              <button
                onClick={() => window.location.reload()}
                className="ml-2 text-primary underline"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WalletConnection({
  variant = "outline",
  size = "sm",
  showAddress = false,
}: WalletConnectionProps) {
  const { state, connect, disconnect } = useConcordium();

  const copyAddress = async () => {
    if (state.account) {
      await navigator.clipboard.writeText(state.account);
      console.log('Address copied:', state.account);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <WalletConnectionErrorBoundary>
      <div className="flex flex-col gap-2">
        {state.isConnected && state.account ? (
          <div className="flex items-center gap-2">
            {showAddress && (
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-mono">{formatAddress(state.account)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Badge variant="secondary" className="gradient-trust text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <>
            {/* {state.error && (
              <Alert className="max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {state.error}
                  <a
                    href="https://chromewebstore.google.com/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                  >
                    Install Wallet <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )} */}
            <Button
              variant={variant as any}
              size={size}
              onClick={(e) => {
                e.preventDefault();
                connect();
              }}
              disabled={state.isConnecting}
              className={state.isConnecting ? "animate-pulse" : ""}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {state.isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </>
        )}
      </div>
    </WalletConnectionErrorBoundary>
  );
}

export default WalletConnection;