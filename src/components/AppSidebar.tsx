import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  Store,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Immobilien", icon: Building2 },
  { to: "/payments", label: "Zahlungen", icon: CreditCard },
  { to: "/chat", label: "Nachrichten", icon: MessageSquare, badge: 2 },
  { to: "/damages", label: "Schäden", icon: AlertTriangle },
  { to: "/marketplace", label: "Marktplatz", icon: Store },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-50">
      <div className="p-6">
        <h1 className="text-xl font-heading font-bold text-sidebar-foreground tracking-tight">
          Will<span className="text-sidebar-primary">Prop</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary text-sm font-bold">
            MK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Max Kaufmann</p>
            <p className="text-xs text-sidebar-muted truncate">Eigentümer</p>
          </div>
          <NavLink to="/" className="text-sidebar-muted hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
