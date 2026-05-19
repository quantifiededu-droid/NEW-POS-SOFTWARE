import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  CreditCard,
  MessageSquare,
  RefreshCw,
  MessageCircle,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Staff from './pages/Staff';
import AIAssistant from './pages/AIAssistant';
import { useSeedData } from './hooks/useSeedData';

import { useSyncEngine } from './hooks/useSyncEngine';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Expenses from './pages/Expenses';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ icon: Icon, label, href, active }: { icon: any, label: string, href: string, active?: boolean }) => (
  <Link 
    to={href}
    className={cn(
      "flex items-center gap-3 px-6 py-3 transition-colors duration-200 group text-sm font-medium",
      active 
        ? "bg-brand-primary text-white" 
        : "text-sidebar-text hover:text-white hover:bg-white/5"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-sidebar-text group-hover:text-white")} />
    <span>{label}</span>
  </Link>
);

const Header = ({ isSyncing, lastSynced, profile }: { isSyncing: boolean, lastSynced: Date | null, profile: any }) => (
  <header className="h-16 border-b border-brand-line bg-white flex items-center justify-between px-8 sticky top-0 z-30">
    <div className="flex flex-col">
       <h2 className="text-lg font-bold text-brand-ink leading-tight">{profile?.full_name || 'My Local Store'}</h2>
       <p className="text-xs text-brand-slate font-medium">
         Logged in as {profile?.full_name?.split(' ')[0] || 'User'}
       </p>
    </div>
    <div className="flex items-center gap-6">
      <div className={cn(
        "px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-2 transition-colors",
        isSyncing 
          ? "bg-blue-50 text-blue-700 border-blue-200" 
          : "bg-green-50 text-green-700 border-green-200"
      )}>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          isSyncing ? "bg-blue-500 animate-spin" : "bg-green-500"
        )}></div>
        {isSyncing ? 'Syncing...' : 'Connected'}
      </div>
      <Link to="/pos" className="bg-brand-primary text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-600 transition-colors">
        Launch POS
      </Link>
    </div>
  </header>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isSyncing, lastSynced } = useSyncEngine();
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Sidebar */}
      <aside className="w-[220px] bg-sidebar-bg flex flex-col py-6 border-r border-brand-line">
        <div className="px-6 mb-10">
          <img 
            src="/src/assets/images/clemtrix_logo_asset_1779216318559.png" 
            alt="Clemtrix Technologies" 
            className="h-10 w-auto brightness-0 invert" 
          />
        </div>

        <nav className="flex-1 flex flex-col">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            href="/dashboard" 
            active={location.pathname === '/dashboard'} 
          />
          <SidebarItem 
            icon={ShoppingCart} 
            label="POS Sales" 
            href="/pos" 
            active={location.pathname === '/pos'} 
          />
          <SidebarItem 
            icon={Package} 
            label="Inventory" 
            href="/inventory" 
            active={location.pathname === '/inventory'} 
          />
          <SidebarItem 
            icon={Receipt} 
            label="Expenses" 
            href="/expenses" 
            active={location.pathname === '/expenses'} 
          />
          <SidebarItem 
            icon={MessageSquare} 
            label="AI Assistant" 
            href="/ai" 
            active={location.pathname === '/ai'} 
          />
          <div className="my-4 border-t border-white/10 mx-6"></div>
          <SidebarItem 
            icon={Users} 
            label="Staff" 
            href="/staff" 
            active={location.pathname === '/staff'} 
          />
          <SidebarItem 
            icon={CreditCard} 
            label="Subscription" 
            href="/subscription" 
            active={location.pathname === '/subscription'} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            href="/settings" 
            active={location.pathname === '/settings'} 
          />
        </nav>

        <div className="mt-auto px-6">
          <div className="bg-white/10 p-4 rounded-xl mb-6">
             <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">AI Plan Active</p>
             <p className="text-xs text-white/80 font-medium">Renews 12 Oct 2024</p>
          </div>
          <a 
            href="https://wa.me/233554117978" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3 w-full text-green-400 hover:text-green-300 transition-colors text-sm font-bold border-t border-white/10 pt-6 mb-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Support</span>
          </a>
          <button 
            onClick={signOut}
            className="flex items-center gap-3 py-3 w-full text-white/60 hover:text-white transition-colors text-sm font-bold border-t border-white/10 pt-6"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <Header isSyncing={isSyncing} lastSynced={lastSynced} profile={profile} />
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-bg">
      <RefreshCw className="animate-spin text-brand-primary w-8 h-8" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

export default function App() {
  useSeedData();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Landing />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/ai" element={<AIAssistant />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
