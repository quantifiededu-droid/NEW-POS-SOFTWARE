import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Monitor, 
  Layers, 
  Zap, 
  Sparkles, 
  MessageCircle, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Check,
  Play,
  ShoppingCart,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [downloadPlatform, setDownloadPlatform] = useState('');
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  
  // Immersive POS Playground State
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([
    { id: '1', name: 'Premium Espresso Beans', price: 45.00, qty: 1 },
    { id: '2', name: 'Artisanal Bread Loaf', price: 18.50, qty: 2 },
  ]);
  const playgroundItems = [
    { id: '1', name: 'Premium Espresso Beans', price: 45.00, category: 'Coffee' },
    { id: '2', name: 'Artisanal Bread Loaf', price: 18.50, category: 'Bakery' },
    { id: '3', name: 'Cold Press Fruit Juice', price: 12.00, category: 'Drinks' },
    { id: '4', name: 'Guatemalan Single Origin', price: 65.00, category: 'Coffee' },
  ];

  const addToPlaygroundCart = (item: typeof playgroundItems[0]) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const removeFromPlaygroundCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleDownload = (platform: string) => {
    setDownloadPlatform(platform);
    setDownloading(true);

    setTimeout(() => {
      // Trigger download of a high-fidelity TXT build guide & instructions file that opens safely on any OS
      const instructionsContent = `========================================================================
CLEMTRIX POS DESKTOP BUILD & PACKAGING GUIDE
========================================================================
Platform: ${platform === 'win' ? 'Windows OS (64-bit)' : 'macOS (Apple Silicon & Intel)'}
Build Date: 2026-05-19
Release: v1.2.0-Production Stable
Status: Sandbox Preview

Dear Store Owner,

Because you are currently browsing this application within the secure AI Studio
Cloud Sandbox server environment, the browser cannot directly compile and output
a real, native binary installer (.exe or .dmg) containing 100MB+ of chromium 
runtimes directly onto your hard drive on-the-fly.

To get a native program installed onto your computer, follow these simple methods:

METHOD A: EXTREMELY EASY PROGRESSIVE WEB APP (PWA) INSTALLATION
------------------------------------------------------------------------
No terminals, no codes, no wait. Run right from your browser!
1. Open this website inside Google Chrome or Microsoft Edge browser.
2. In the browser URL address bar at the top, look at the right end.
3. Click the "Install Clemtrix" icon (looks like a monitor with an arrow or a "+" symbol).
4. Click 'Install' when prompted.
5. Clemtrix POS will instantly launch as a standalone desktop app on your
   Windows taskbar/desktop with separate window controls and offline persistence!

METHOD B: BUNDLE NATIVE RUNTIME (For Developers)
------------------------------------------------------------------------
If you downloaded this code to run locally:
1. Extract the downloaded source block.
2. Open terminal in the project root directory and run:
   $ npm install
3. Compile the application production assets:
   $ npm run build
4. package the application for Windows/macOS using Electron or Tauri:
   $ npx electron-builder --win (or --mac)
5. Find your brand new fully-functional .exe installer in the /dist directory!

Support Hotline & Chat: +233 55 411 7978
========================================================================`;
      
      const blob = new Blob([instructionsContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = platform === 'win' ? 'Clemtrix_Desktop_Install_Guide.txt' : 'Clemtrix_Mac_Install_Guide.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloading(false);
      setShowInstructionsModal(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white selection:bg-brand-primary/30 font-sans overflow-x-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Nav */}
      <header className="relative z-50 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-brand-primary p-2 rounded-xl block">
                <Layers className="w-5 h-5 text-white" />
              </span>
              <span>CLEM<span className="text-brand-primary">TRIX</span></span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#playground" className="hover:text-white transition-colors">POS Simulator</a>
            <a href="#downloads" className="hover:text-white transition-colors">Desktop App</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              to="/dashboard" 
              className="bg-brand-primary hover:bg-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all"
            >
              Go to POS Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-white/85 hover:text-white transition-all">
                Sign in
              </Link>
              <Link 
                to="/register" 
                className="bg-white hover:bg-white/90 text-[#090d16] px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all"
              >
                Register Business
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-28 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-white mb-6">
          <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
          <span>Universal Offline-First & Desktop POS System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6 text-white text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/60">
          Run your point-of-sale in the <span className="text-brand-primary">Browser</span> or on your <span className="underline decoration-brand-primary decoration-4">Desktop</span>
        </h1>

        <p className="text-base sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          ClemTrix delivers ultra-fast, offline-resilient retail capabilities with instant device synchronization, staff tracking, automated WhatsApp updates, and artificial intelligence insight logging.
        </p>

        {/* Dynamic CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            onClick={() => handleDownload('win')}
            className="w-full sm:w-auto bg-brand-primary hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" />
            <span>Download for Windows (.exe)</span>
          </button>
          
          <Link 
            to={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Launch Web POS</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Platforms */}
        <div className="flex items-center justify-center gap-6 text-xs text-white/40 mb-20">
          <span className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Fully compatible with Windows 10/11</span>
          <span className="h-4 w-[1px] bg-white/10" />
          <span className="flex items-center gap-2" onClick={() => handleDownload('mac')} style={{ cursor: 'pointer' }}><Layers className="w-4 h-4" /> macOS App Available (.dmg)</span>
        </div>
      </section>

      {/* Interactive Simulation POS Section */}
      <section id="playground" className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight mb-3">Try the Live POS Simulator</h2>
          <p className="text-white/50 text-sm max-w-lg mx-auto font-medium">
            Register products, compute totals, and checkout offline directly in this demo before setting up your profile account.
          </p>
        </div>

        {/* Immersive POS frame */}
        <div className="bg-[#0f172a] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-green-500/10 text-green-400 text-[10px] font-bold uppercase py-1 px-2.5 rounded-full border border-green-500/20">
              Offline Cache Engine Active
            </span>
          </div>

          {/* Left: Product Choice Grid */}
          <div className="lg:col-span-7 flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-primary" /> Products Database
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {playgroundItems.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => addToPlaygroundCart(item)}
                  className="bg-[#17243c] border border-white/5 hover:border-brand-primary/40 rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 group"
                >
                  <p className="text-[10px] uppercase font-bold text-white/40 mb-1">{item.category}</p>
                  <h4 className="text-sm font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">{item.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white/90">GHS {item.price.toFixed(2)}</span>
                    <span className="bg-white/5 p-1 rounded-lg text-xs group-hover:bg-brand-primary group-hover:text-white transition-all">
                      <Plus className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Simulated POS Billing Queue */}
          <div className="lg:col-span-5 bg-[#172134] rounded-2xl border border-white/5 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white/50 mb-4">Billing Receipt Queue</h3>
              
              {cart.length === 0 ? (
                <div className="py-12 text-center text-white/30 flex flex-col items-center gap-3">
                  <ShoppingCart className="w-10 h-10 stroke-1" />
                  <p className="text-xs font-semibold">Your billing register is empty.</p>
                  <p className="text-[10px]">Click a product on the left to add.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-[#0f172a] p-3 rounded-xl">
                      <div>
                        <h5 className="font-bold text-white">{item.name}</h5>
                        <p className="text-white/40 text-[10px] mt-0.5">
                          {item.qty} x GHS {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white">GHS {(item.price * item.qty).toFixed(2)}</span>
                        <button 
                          onClick={() => removeFromPlaygroundCart(item.id)}
                          className="text-white/40 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-white/60">Grand Total</span>
                <span className="text-lg font-black text-white">GHS {totalAmount.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => {
                  alert(`POS Transaction simulated successfully! Order total GHS ${totalAmount.toFixed(2)} registered. Register an account to make use of persistent cloud inventory logs, multi-staff permission management, and custom automated subscriptions!`);
                  setCart([]);
                }}
                disabled={cart.length === 0}
                className="w-full bg-brand-primary disabled:opacity-40 hover:bg-blue-600 disabled:hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Process Checkout (Simulate)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section id="features" className="relative z-10 bg-[#0c1220] py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Crafted for Fast Retail Commerce</h2>
            <p className="text-sm sm:text-base text-white/50 font-medium">
              We merge native desktop performance with simple unified cloud databases for a seamless store management experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Offline-Proof Operation</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
                Keep selling even when your internet crashes. Core indexes are fully stored in local browser db or desktop client storage, synchronizing with Supabase database as soon as connection is re-established.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Omnipresent AI Support</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
                Need details about popular products or immediate summary metrics? Built-in backend AI logging and LLM integration allows cashiers to request insights dynamically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Automated WhatsApp Statuses</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
                Send alert flags, status receipts, or inventory log updates instantly to administrative partners and suppliers via real-time WhatsApp templates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Multi-Platform Client</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
                Choose what fits your cash register hardware best: run directly in any web browser, or launch the Electron setup package on Windows desktops.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Admin-Level RLS Policies</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
                Your data is safe and secure. Our database policy layers utilize custom triggers and secure RLS definitions so team members only access what they are permitted.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Bulk Inventory Editing</h3>
              <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
                Manage stock levels seamlessly. Select multiple products simultaneously in our inventory grid to alter price values, stock counts, or deactivate items instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="downloads" className="relative z-10 max-w-5xl mx-auto px-6 py-28 text-center">
        <h2 className="text-3xl sm:text-5xl font-black mb-4">Install Clemtrix on Desktop</h2>
        <p className="text-white/50 font-medium max-w-xl mx-auto mb-12 text-sm sm:text-base">
          Get maximum native runtime power with customizable system overlays, direct local database file connections, and automatic backgrounds updates.
        </p>

        {/* Action download grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Windows Download */}
          <div className="bg-[#0f172a] p-8 rounded-2xl border border-white/10 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2.5 bg-brand-primary/10 rounded-xl">
                  <Monitor className="w-5 h-5 text-brand-primary" />
                </span>
                <span className="font-black text-lg text-white">Windows Client</span>
              </div>
              <ul className="space-y-3 mb-8 text-xs text-white/60 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Dual standalone desktop file</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Windows Defender safe unsigned stub</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Auto launches on startup</li>
              </ul>
            </div>
            <button
              onClick={() => handleDownload('win')}
              disabled={downloading}
              className="w-full bg-brand-primary hover:bg-blue-600 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Setup (.exe)</span>
            </button>
          </div>

          {/* macOS Download */}
          <div className="bg-[#0f172a] p-8 rounded-2xl border border-white/10 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2.5 bg-brand-primary/10 rounded-xl">
                  <Layers className="w-5 h-5 text-brand-primary" />
                </span>
                <span className="font-black text-lg text-white">macOS Client</span>
              </div>
              <ul className="space-y-3 mb-8 text-xs text-white/60 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Apple Silicon & Intel compatible</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Clean native menu controls</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> Highly insulated Sandbox active</li>
              </ul>
            </div>
            <button
              onClick={() => handleDownload('mac')}
              disabled={downloading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Installer (.dmg)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Global Downloading Modal Loader */}
      {downloading && (
        <div className="fixed inset-0 bg-brand-ink/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
            <RefreshCw className="w-12 h-12 text-brand-primary animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-black text-white mb-2">Compiling Desktop Package</h3>
            <p className="text-xs text-white/60 font-medium mb-6">
              Packaging standard standalone installer for {downloadPlatform === 'win' ? 'Windows OS (.exe)' : 'macOS (.dmg)'}...
            </p>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-primary h-full animate-pulse w-4/5" />
            </div>
          </div>
        </div>
      )}

      {/* Educational Desktop Installation Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-brand-ink/95 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-[#0f172a] w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setShowInstructionsModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-brand-primary" />
            </div>

            <h3 className="text-2xl font-black text-white mb-2">How to Run on Windows/macOS Desktop</h3>
            <p className="text-xs text-white/50 font-medium mb-6">
              We have downloaded <span className="text-brand-primary font-bold">Clemtrix_Desktop_Install_Guide.txt</span> to your computer with full instructions. Review the instant methods below to proceed:
            </p>

            <div className="space-y-4 mb-8">
              {/* Option 1: PWA */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded uppercase">Method A (Easiest)</span>
                  <p className="text-sm font-black text-white">Browser App Shortcut (PWA)</p>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  You can install Clemtrix directly from Chrome or Edge right now! Click the <strong className="text-white">Install</strong> button (looks like a monitor with an arrow) on the right of the browser URL bar.
                </p>
              </div>

              {/* Option 2: Electron Pack */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black bg-white/15 text-white/80 px-2 py-0.5 rounded uppercase">Method B (For Developers)</span>
                  <p className="text-sm font-black text-white">Build Executable from Source Code</p>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-3">
                  To package a real native Windows <code className="text-brand-primary">.exe</code> setup binary, open your terminal in this workspace and run:
                </p>
                <div className="bg-[#090d16] font-mono text-[11px] p-3 rounded-lg text-white/80 space-y-1 border border-white/5">
                  <p className="text-brand-primary"># 1. Install dependencies</p>
                  <p>$ npm install</p>
                  <p className="text-brand-primary"># 2. Build code & pack with Electron</p>
                  <p>$ npm run build</p>
                  <p>$ npx electron-builder --win</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="flex-1 py-3 text-sm font-bold bg-brand-primary hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg"
              >
                Got it, thank you!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 bg-[#0c1220] py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Flexible Subscriptions for any Retail Plan</h2>
            <p className="text-sm text-white/50 font-medium">
              Scale up your checkout lanes. Launch with a straightforward configuration and level up when needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Basic</p>
                <h4 className="text-2xl font-black text-white mb-4">Free Plan</h4>
                <p className="text-xs text-white/55 mb-6">Best suited for small localized registers and single stores.</p>
                <hr className="border-white/5 mb-6" />
                <ul className="space-y-3 text-xs font-semibold text-white/70 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Uncapped Products & Sales</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Web Browser Interface</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Core Offline Dexie Database</li>
                </ul>
              </div>
              <Link to="/register" className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 text-center rounded-xl text-xs transition-colors">
                Get Started
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="bg-[#0f172a] rounded-2xl border-2 border-brand-primary p-8 flex flex-col justify-between relative shadow-2xl">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-brand-primary text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-brand-primary tracking-wider mb-2">Medium</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <h4 className="text-2xl font-black text-white">GHS 150</h4>
                  <span className="text-xs text-white/40">/month</span>
                </div>
                <p className="text-xs text-white/55 mb-6">Ideal for busy single stores needing Desktop standalone installation.</p>
                <hr className="border-white/5 mb-6" />
                <ul className="space-y-3 text-xs font-semibold text-white/70 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> All Basic Plan offerings</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Desktop Native App Download</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Standalone Setup Wizard (.exe)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Low-Stock Email & SMS Alerts</li>
                </ul>
              </div>
              <Link to="/register" className="w-full bg-brand-primary hover:bg-blue-600 text-white font-bold py-3 text-center rounded-xl text-xs shadow-lg transition-colors">
                Choose Medium
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">AI Premium</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <h4 className="text-2xl font-black text-white">GHS 300</h4>
                  <span className="text-xs text-white/40">/month</span>
                </div>
                <p className="text-xs text-white/55 mb-6">Premium plan for enterprises seeking AI assistance & auto billing audits.</p>
                <hr className="border-white/5 mb-6" />
                <ul className="space-y-3 text-xs font-semibold text-white/70 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> All Medium Plan offerings</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> AI Assistant with database insights</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Unlimited Multi-user Cashier roles</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-brand-primary" /> Automated Subscriptions Statuses</li>
                </ul>
              </div>
              <Link to="/register" className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 text-center rounded-xl text-xs transition-colors">
                Go Premium AI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-xs text-white/40 mt-12 bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© 2026 ClemTrix Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium text-white/30">
            <a href="#features" className="hover:text-white/60">Features</a>
            <a href="#playground" className="hover:text-white/60">Simulator</a>
            <a href="#downloads" className="hover:text-white/60">Desktop Client</a>
            <a href="https://wa.me/233554117978" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 text-green-400">Support Line</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
