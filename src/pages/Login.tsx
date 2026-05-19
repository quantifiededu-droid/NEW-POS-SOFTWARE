import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { LogIn, Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <img 
             src="/src/assets/images/clemtrix_logo_asset_1779216318559.png" 
             alt="Clemtrix Technologies" 
             className="h-20 w-auto mx-auto mb-4" 
           />
           <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[10px] bg-slate-100 px-4 py-1 rounded-full inline-block">System Access</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100">
           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100">
               {error}
             </div>
           )}
           
           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-4">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@business.com"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-4">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary/20 border-slate-200" />
                  <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-sm font-bold text-brand-primary hover:underline">Forgot access?</button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black text-lg shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
                Sign In to POS
              </button>
           </form>

           <div className="mt-10 pt-10 border-t border-slate-50 text-center">
              <p className="text-slate-400 font-medium">New business in Nkawkaw?</p>
              <Link to="/register" className="text-brand-primary font-black mt-1 hover:underline block">Register Business Account</Link>
           </div>
        </div>
        
        <div className="flex flex-col items-center mt-8 space-y-4">
          <p className="text-slate-400 text-xs font-medium">
            Need help? Contact the developer:
          </p>
          <a 
            href="https://wa.me/233554117978" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full font-black text-xs hover:bg-green-600 transition-all shadow-lg shadow-green-200 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Support
          </a>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          &copy; 2024 CLEMTRIX TECHNOLOGIES. All rights reserved.
        </p>
      </div>
    </div>
  );
}
