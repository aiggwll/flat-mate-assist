import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useDemo } from "@/contexts/DemoContext";
import { useMessages } from "@/contexts/MessagesContext";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  FileText,
  AlertTriangle,
  Receipt,
  FolderOpen,
  Store,
  LogOut,
  RotateCcw,
} from "lucide-react";
import DwelloLogo from "./DwelloLogo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Miete", icon: CreditCard },
  { to: "/nebenkostenabrechnung", label: "Nebenkostenabrechnung", icon: Receipt },
  { to: "/tax-folder", label: "Steuermappe", icon: FolderOpen },
  { to: "/documents", label: "Dokumente", icon: FileText },
  { to: "/chat", label: "Nachrichten", icon: MessageSquare },
  { to: "/damages", label: "Schäden", icon: AlertTriangle },
  { to: "/marketplace", label: "Marktplatz", icon: Store },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, userRole, gender, signOut } = useUser();
  const { isDemo, demoName, demoRole, resetDemo } = useDemo();
  const { messages } = useMessages();

  const displayName = isDemo ? (demoName || "Demo-Nutzer") : (userName || "Eigentümer");
  const displayRole = isDemo
    ? (demoRole === "tenant" ? "Mieter" : "Vermieter")
    : (userRole === "tenant" ? "Mieter" : gender === "Frau" ? "Eigentümerin" : gender === "Herr" ? "Eigentümer" : "Vermieter");
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase() || "??";
  const unreadCount = messages.filter(m => !m.read && m.to === userName).length;

  // Role detection: demo overrides; otherwise use Supabase profile role
  const effectiveRole: "owner" | "tenant" = isDemo
    ? (demoRole === "tenant" ? "tenant" : "owner")
    : (userRole === "tenant" ? "tenant" : "owner");
  const isTenant = effectiveRole === "tenant";

  // Role-based sidebar theming via CSS variable overrides (HSL, semantic tokens)
  const sidebarThemeStyle = isTenant
    ? {
        // Dunkelblau – Mieter
        ["--sidebar-background" as any]: "214 50% 18%",
        ["--sidebar-foreground" as any]: "210 30% 96%",
        ["--sidebar-muted" as any]: "212 20% 70%",
        ["--sidebar-accent" as any]: "214 45% 26%",
        ["--sidebar-accent-foreground" as any]: "0 0% 100%",
        ["--sidebar-border" as any]: "214 35% 24%",
      }
    : {
        // Dunkelgrün – Vermieter
        ["--sidebar-background" as any]: "153 35% 16%",
        ["--sidebar-foreground" as any]: "150 25% 96%",
        ["--sidebar-muted" as any]: "150 15% 70%",
        ["--sidebar-accent" as any]: "153 35% 24%",
        ["--sidebar-accent-foreground" as any]: "0 0% 100%",
        ["--sidebar-border" as any]: "153 30% 22%",
      };

  const badgeClass = isTenant
    ? "bg-blue-500/90 text-white"
    : "bg-emerald-600/90 text-white";

  const handleLogout = async () => {
    if (isDemo) {
      resetDemo();
      navigate("/");
    } else {
      await signOut();
      navigate("/");
    }
  };

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
      style={sidebarThemeStyle}
      data-role={effectiveRole}
    >
      <div className="p-6 pb-4 space-y-3">
        <DwelloLogo variant="dark" size="md" />
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          {isTenant ? "Mieter" : "Vermieter"}
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          const badge = to === "/chat" && unreadCount > 0 ? unreadCount : null;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-[3px] border-primary"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-muted/50 border-l-[3px] border-transparent"
              }`}
              style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {isDemo && (
          <button
            onClick={() => { resetDemo(); navigate("/"); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Demo zurücksetzen
          </button>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-xs text-sidebar-muted truncate">{displayRole}</p>
          </div>
          <button onClick={handleLogout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
