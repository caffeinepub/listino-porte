import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import { Calculator, FileText, LogIn, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Navbar() {
  const { login, clear, identity, isLoggingIn } = useInternetIdentity();
  const loc = useLocation();

  const isActive = (path: string) => loc.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5"
            data-ocid="nav.link"
          >
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs leading-none">
                H&F
              </span>
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-sm text-foreground tracking-tight">
                H&F Society
              </span>
              <span className="block text-[10px] text-muted-foreground tracking-widest uppercase">
                Door Stylist
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-ocid="nav.link"
            >
              <Calculator className="w-3.5 h-3.5" />
              Preventivatore
            </Link>

            <Link
              to="/preventivi"
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                isActive("/preventivi")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-ocid="nav.link"
            >
              <FileText className="w-3.5 h-3.5" />
              Storico
            </Link>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {identity ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => clear()}
                className="flex items-center gap-1.5 text-xs h-8 px-3"
                data-ocid="nav.toggle"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => login()}
                  disabled={isLoggingIn}
                  className="flex items-center gap-1.5 text-xs h-8 px-3"
                  data-ocid="nav.toggle"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {isLoggingIn ? "Accesso..." : "Accedi"}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
