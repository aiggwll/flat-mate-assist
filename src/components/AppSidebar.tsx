import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
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
  LogOut,
} from "lucide-react";
import DwelloLogo from "./DwelloLogo";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Miete", icon: CreditCard },
  { to: "/utility-billing", label: "Abrechnung", icon: Receipt },
  { to: "/tax-folder", label: "Steuermappe", icon: FolderOpen },
  { to: "/documents", label: "Dokumente", icon: FileText },
  { to: "/chat", label: "Nachrichten", icon: MessageSquare },
  { to: "/damages", label: "Schäden", icon: AlertTriangle },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userName, userRole, signOut } = useUser();
  const { messages } = useMessages();
  const initials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "??";

  const unreadCount = messages.filter(m => !m.read && m.to === userName).length;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="p-6 pb-5">
        <DwelloLogo variant="light" size="md" />
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-muted/50"
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

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName || "Eigentümer"}</p>
            <p className="text-xs text-sidebar-muted truncate">Vermieter</p>
          </div>
          <button onClick={async () => { await signOut(); navigate("/"); }} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
