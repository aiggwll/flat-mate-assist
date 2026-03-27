import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      {/* Mobile nav */}
      <MobileNav />
      <main className="md:ml-64 md:p-8 p-4 pt-18 pb-20 md:pt-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
