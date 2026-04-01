import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  Menu,
} from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Store,
  ClipboardCheck,
  FileText,
  LogOut,
} from "lucide-react";

const primaryNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Zahlungen", icon: CreditCard },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

const allNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Zahlungen", icon: CreditCard },
  { to: "/documents", label: "Dokumente", icon: FileText },
  { to: "/chat", label: "Nachrichten", icon: MessageSquare },
  { to: "/tasks", label: "Aufgaben", icon: ClipboardCheck },
  { to: "/marketplace", label: "Marktplatz", icon: Store },
];

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, signOut } = useUser();
  const [open, setOpen] = useState(false);
  const initials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "??";

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b flex items-center justify-between px-4 z-50 md:hidden">
        <h1 className="text-lg font-heading font-bold text-foreground tracking-tight">
          Will<span className="text-accent">Prop</span>
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
                Will<span className="text-accent">Prop</span>
              </h2>
            </div>
            <nav className="p-3 space-y-1">
              {allNav.map(({ to, label, icon: Icon }) => {
                const isActive = location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold">
                  MK
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Max Kaufmann</p>
                  <p className="text-xs text-muted-foreground truncate">Eigentümer</p>
                </div>
                <NavLink to="/" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <LogOut className="h-4 w-4" />
                </NavLink>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex items-center justify-around h-16 z-50 md:hidden safe-bottom">
        {primaryNav.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-accent" : "text-muted-foreground"
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
