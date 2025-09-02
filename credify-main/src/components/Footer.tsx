import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/30 bg-background/50 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-46 flex items-center justify-center">
              <img src="/credify-logo.png" alt="Credify Logo" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">© 2025</span>
          </div>
          <div className="text-xs text-muted-foreground text-center md:text-right">
            Powered by Concordium Mainnet • Built for the future of commerce
          </div>
        </div>
      </div>
    </footer>
  );
}