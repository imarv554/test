import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Fingerprint,
  Loader2
} from "lucide-react";
import { useConcordium } from "@/contexts/ConcordiumContext";

interface AgeVerificationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  minimumAge: number;
  productTitle: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function AgeVerification({
  isOpen,
  onOpenChange,
  minimumAge,
  productTitle,
  onVerified,
  onCancel,
}: AgeVerificationProps) {
  const { state, verifyAge, connect } = useConcordium();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const handleVerification = async () => {
    if (!state.isConnected) {
      await connect();
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const verified = await verifyAge(minimumAge);
      
      if (verified) {
        onVerified();
        onOpenChange(false);
      } else {
        setVerificationError("Age verification failed. Please ensure you meet the minimum age requirement.");
      }
    } catch (error: any) {
      setVerificationError(error.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
    setVerificationError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            This product requires age verification to purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{productTitle}</h4>
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {minimumAge}+
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Age restriction: Must be {minimumAge} years or older to purchase this item.
            </p>
          </div>

          {/* Zero-Knowledge Verification Info */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy-Preserving Verification:</strong> We use zero-knowledge proofs 
              to verify your age without revealing your birth date or personal information. 
              Your privacy is protected throughout the process.
            </AlertDescription>
          </Alert>

          {/* Verification Steps */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              How it works:
            </h5>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span>Connect your Concordium wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span>Sign a verification message</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span>Zero-knowledge proof confirms your age</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span>No personal data is revealed or stored</span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          {!state.isConnected && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to connect your Concordium wallet to proceed with age verification.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {verificationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleVerification}
              disabled={isVerifying}
              className="flex-1 gradient-trust text-white"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {state.isConnected ? "Verify Age" : "Connect & Verify"}
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={handleCancel} disabled={isVerifying}>
              Cancel
            </Button>
          </div>

          {/* Legal Notice */}
          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            By proceeding, you confirm that you are at least {minimumAge} years old and 
            agree to CREDIFY's age verification terms.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AgeVerification;