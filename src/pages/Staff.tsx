import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { 
  Plus, 
  Users, 
  Shield, 
  UserPlus,
  Crown,
  AlertCircle,
  Camera,
  Trash2,
  Mail,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  status: string;
  avatar_url: string;
  email?: string;
}

export default function Staff() {
  const { profile } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'cashier',
    avatar_url: ''
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { id: profile?.id || '1', full_name: profile?.full_name || 'Admin User', role: profile?.role || 'admin', status: 'Active', avatar_url: '', email: 'admin@clemtrix.com' },
    { id: '2', full_name: 'Kofi Mensah', role: 'cashier', status: 'Active', avatar_url: '', email: 'kofi@clemtrix.com' },
  ]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, staffId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (staffId) {
          setStaffMembers(prev => prev.map(member => 
            member.id === staffId ? { ...member, avatar_url: result } : member
          ));
        } else {
          setFormData({ ...formData, avatar_url: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffMembers(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      full_name: formData.full_name,
      role: formData.role,
      status: 'Active',
      avatar_url: formData.avatar_url,
      email: formData.email
    }]);
    setIsAddModalOpen(false);
    setFormData({ full_name: '', email: '', role: 'cashier', avatar_url: '' });
  };

  const plan = profile?.business?.plan || 'basic';
  const staffCount = staffMembers.length;
  const isPremium = plan === 'ai' || plan === 'medium';
  const canAddStaff = isPremium || staffCount < 2;

  const handleAddStaffClick = () => {
    if (!canAddStaff) {
      setShowUpgradeModal(true);
    } else {
      setIsAddModalOpen(true);
    }
  };

  const triggerFileUpload = (staffId: string) => {
    setActiveStaffId(staffId);
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-brand-ink tracking-tight mb-1">Staff Directory</h1>
          <p className="text-sm font-medium text-brand-slate flex items-center gap-2">
            <Users className="w-4 h-4" />
            {staffCount} Team Members • {isPremium ? (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Crown className="w-3.5 h-3.5" /> Premium Plan
              </span>
            ) : (
              <span className="text-brand-primary">Free Plan (2 max)</span>
            )}
          </p>
        </div>
        <button 
          onClick={handleAddStaffClick}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Team Member
        </button>
      </div>

      {!isPremium && staffCount >= 2 && (
        <div className="mb-10 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="bg-amber-100 p-4 rounded-2xl">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-lg font-black text-amber-900 mb-1">Scale your business</p>
            <p className="text-sm text-amber-700 font-medium">You've reached the free staff limit. Upgrade to Premium for unlimited staff members, advanced roles, and AI-powered performance tracking.</p>
          </div>
          <button className="whitespace-nowrap bg-amber-600 text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-amber-700 transition-all shadow-lg shadow-amber-200">
            Upgrade for GHȻ 49
          </button>
        </div>
      )}

      {/* Hidden file input for updating existing staff avatars */}
      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => activeStaffId && handleImageChange(e, activeStaffId)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {staffMembers.map((member) => (
          <div key={member.id} className="group bg-white border border-brand-line p-6 rounded-[32px] hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                member.status === 'Active' ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
              )}>
                {member.status}
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-white shadow-xl ring-1 ring-brand-line bg-slate-50 group-hover:scale-105 transition-transform duration-500">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-brand-primary/30 uppercase">
                      {member.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => triggerFileUpload(member.id)}
                  className="absolute -bottom-2 -right-2 bg-brand-primary text-white p-2.5 rounded-2xl shadow-xl hover:bg-blue-600 transition-colors border-4 border-white active:scale-90"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-black text-brand-ink mb-1">{member.full_name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <Shield className={cn(
                  "w-3.5 h-3.5",
                  member.role === 'admin' ? "text-red-500" : "text-brand-primary"
                )} />
                <span className="text-xs font-bold text-brand-slate uppercase tracking-widest">{member.role}</span>
              </div>

              <div className="w-full bg-slate-50 rounded-2xl p-4 space-y-2 mb-6">
                <div className="flex items-center gap-3 text-brand-slate">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium truncate">{member.email || 'no-email@clemtrix.com'}</span>
                </div>
                <div className="flex items-center gap-3 text-brand-slate">
                  <UserCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Joined {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button className="py-2.5 bg-slate-100 text-brand-slate rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                  Edit Profile
                </button>
                <button className="py-2.5 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}

        {canAddStaff && (
          <button 
            onClick={handleAddStaffClick}
            className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-brand-line rounded-[32px] hover:border-brand-primary hover:bg-blue-50/30 transition-all duration-300 min-h-[350px]"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <p className="font-black text-brand-ink">Add New Member</p>
            <p className="text-sm font-medium text-brand-slate text-center mt-2 px-6">Grow your team with managers and cashiers</p>
          </button>
        )}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 border border-brand-line shadow-2xl text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-[24px] flex items-center justify-center mx-auto mb-8 rotate-3">
              <Crown className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-3xl font-black text-brand-ink mb-4 tracking-tight">Go Premium</h2>
            <p className="text-brand-slate text-sm mb-10 leading-relaxed font-medium">
              The free version of Clemtrix POS allows up to 2 staff members. Upgrade to manage unlimited staff, unlock AI analytics, and multi-store support.
            </p>
            <div className="space-y-4">
              <button className="w-full py-5 bg-brand-primary text-white rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                Unlock Premium for GHȻ 49/mo
              </button>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-4 text-brand-slate font-bold text-sm hover:bg-slate-50 rounded-[20px] transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 border border-brand-line shadow-2xl">
            <h2 className="text-3xl font-black text-brand-ink mb-8 tracking-tight">New Team Member</h2>
            <form onSubmit={handleAddStaff} className="space-y-6">
               <div className="flex gap-6 items-start">
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleImageChange(e)}
                    />
                    <div className="w-24 h-24 rounded-[32px] border-2 border-dashed border-brand-line flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-all overflow-hidden relative">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 text-brand-slate/40 mb-1" />
                          <span className="text-[9px] font-black text-brand-slate/60 uppercase tracking-widest">Avatar</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/10 transition-colors" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-brand-slate uppercase tracking-widest mb-2">Full Name</label>
                      <input 
                        required
                        className="w-full bg-slate-50 border border-brand-line rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none"
                        placeholder="e.g. Ama Serwaa"
                        value={formData.full_name}
                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>
                  </div>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-brand-slate uppercase tracking-widest mb-2">Email Address</label>
                 <input 
                   required type="email"
                   className="w-full bg-slate-50 border border-brand-line rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none"
                   placeholder="ama@clemtrixpos.com"
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-black text-brand-slate uppercase tracking-widest mb-2">Assign Role</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'cashier'})}
                      className={cn(
                        "py-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                        formData.role === 'cashier' ? "border-brand-primary bg-blue-50 text-brand-primary" : "border-brand-line bg-slate-50 text-brand-slate"
                      )}
                    >
                      Cashier
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, role: 'manager'})}
                      className={cn(
                        "py-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                        formData.role === 'manager' ? "border-brand-primary bg-blue-50 text-brand-primary" : "border-brand-line bg-slate-50 text-brand-slate"
                      )}
                    >
                      Manager
                    </button>
                 </div>
               </div>
               <div className="flex gap-4 pt-6">
                 <button 
                   type="button"
                   onClick={() => setIsAddModalOpen(false)}
                   className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-brand-slate hover:bg-slate-50 rounded-xl transition-colors border-2 border-brand-line"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="flex-1 py-4 font-black text-xs uppercase tracking-widest bg-brand-primary text-white rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
                 >
                   Send Invite
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
