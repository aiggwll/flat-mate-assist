import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { MessagesProvider } from "./contexts/MessagesContext";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TenantDashboardPage from "./pages/TenantDashboardPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import RentTrackingPage from "./pages/RentTrackingPage";
import ChatPage from "./pages/ChatPage";
import DamagesPage from "./pages/DamagesPage";
import DocumentsPage from "./pages/DocumentsPage";
import TasksPage from "./pages/TasksPage";
import MarketplacePage from "./pages/MarketplacePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
      <MessagesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/payments" element={<RentTrackingPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/damages" element={<DamagesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
            </Route>
            <Route path="/tenant-dashboard" element={<TenantDashboardPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MessagesProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
