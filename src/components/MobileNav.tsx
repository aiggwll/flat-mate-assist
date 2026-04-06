import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  Menu,
  FileText,
  LogOut,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Miete", icon: CreditCard },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

const allNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Miete", icon: CreditCard },
  { to: "/utility-billing", label: "Abrechnung", icon: Receipt },
  { to: "/documents", label: "Dokumente", icon: FileText },
  { to: "/chat", label: "Nachrichten", icon: MessageSquare },
  { to: "/damages", label: "Schäden", icon: AlertTriangle },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, signOut } = useUser();
  const [open, setOpen] = useState(false);
  const initials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "??";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b flex items-center justify-between px-4 z-50 md:hidden">
        <h1 className="text-lg font-heading font-bold text-foreground tracking-tight">
          Dwell<span className="text-primary">o</span>
        </h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="p-6 border-b">
              <h2 className="text-lg font-heading font-bold text-foreground">
                Dwell<span className="text-primary">o</span>
              </h2>
            </div>
            <nav className="p-3 space-y-0.5">
              {allNav.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{userName || "Eigentümer"}</p>
                  <p className="text-xs text-muted-foreground truncate">Vermieter</p>
                </div>
                <button onClick={async () => { setOpen(false); await signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex items-center justify-around h-16 z-50 md:hidden safe-bottom">
        {primaryNav.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">Mehr</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNav;
