import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { UserPlus, Lock, Mail, Loader2, Building, ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      
      // 1. Create the business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([{ name: businessName, plan: 'basic' }])
        .select()
        .single();

      if (businessError) throw businessError;

      // 2. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account');

      // 3. Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          business_id: business.id,
          full_name: fullName,
          whatsapp_number: whatsappNumber,
          role: 'admin'
        }]);

      if (profileError) throw profileError;

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <img 
             src="/src/assets/images/clemtrix_logo_asset_1779216318559.png" 
             alt="Clemtrix Technologies" 
             className="h-16 w-auto mx-auto mb-4" 
           />
           <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[10px] bg-slate-100 px-4 py-1 rounded-full inline-block">Business Registration</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100">
           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100">
               {error}
             </div>
           )}
           
           <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-4 tracking-widest">Business Name</label>
                <div className="relative group">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Nkawkaw Supermarket"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-4 tracking-widest">Owner Full Name</label>
                <div className="relative group">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Clement Asare"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-4 tracking-widest">WhatsApp Number</label>
                <div className="relative group">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. 0554117978"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-4 tracking-widest">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="email" 
                    required
                    placeholder="name@business.com"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-4 tracking-widest">Create Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-primary transition-colors" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-brand-primary/20 transition-all font-bold"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-primary text-white rounded-2xl py-4 font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100 mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Building className="w-6 h-6" />}
                Register Business
              </button>
           </form>

           <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <Link to="/login" className="flex items-center justify-center gap-2 text-slate-400 font-bold hover:text-brand-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
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
      </div>
    </div>
  );
}
