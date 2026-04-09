import { Outlet, Navigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { useUser } from "@/contexts/UserContext";

const AppLayout = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block" aria-hidden="true">
        <AppSidebar />
      </div>
      {/* Mobile nav */}
      <MobileNav />
      <main className="md:ml-64 md:p-8 p-4 pt-18 pb-20 md:pt-8 md:pb-8 h-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;