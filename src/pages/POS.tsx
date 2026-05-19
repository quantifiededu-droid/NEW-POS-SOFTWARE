import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Product } from '../types';
import { 
  Search, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  X,
  CheckCircle2,
  Receipt,
  Package,
  Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../hooks/useAuth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function POS() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo'>('cash');
  const [isSuccess, setIsSuccess] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const products = useLiveQuery(async () => {
    if (!searchTerm) return db.products.limit(20).toArray();
    // Search by name or barcode
    return db.products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.barcode && p.barcode.includes(searchTerm))
      ).toArray();
  }, [searchTerm]);

  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  , [cart]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search: Ctrl+/ or Alt+S
      if ((e.ctrlKey && e.key === '/') || (e.altKey && e.key === 's')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Checkout: Shift+Enter or F2
      if ((e.shiftKey && e.key === 'Enter') || e.key === 'F2') {
        if (cart.length > 0 && !isCheckoutOpen) {
          e.preventDefault();
          setIsCheckoutOpen(true);
        }
      }

      // Quick add if there's only one search result and Enter is pressed in search input
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current) {
        if (products && products.length > 0) {
          addToCart(products[0]);
          setSearchTerm('');
        }
      }

      // Close modal
      if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isCheckoutOpen, products]);

  // Auto-focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleCheckout = async () => {
    if (!profile?.business_id) {
       alert("Sync not available: No active business session.");
       return;
    }
    const saleId = uuidv4();
    const newSale = {
      id: saleId,
      business_id: profile.business_id,
      user_id: profile.id,
      total_amount: total,
      payment_method: paymentMethod,
      status: 'completed' as const,
      created_at: new Date().toISOString(),
      synced: false
    };

    const saleItems = cart.map(item => ({
      id: uuidv4(),
      sale_id: saleId,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity
    }));

    await db.sales.add(newSale);
    await db.saleItems.bulkAdd(saleItems);
    
    await db.syncQueue.add({
      type: 'sale',
      data: { sale: newSale, items: saleItems },
      created_at: Date.now()
    });

    for (const item of cart) {
      await db.products.where('id').equals(item.product.id).modify(p => {
        p.stock_quantity -= item.quantity;
      });
    }

    setIsSuccess(true);
    setCompletedOrder({
      sale: newSale,
      items: cart,
      subtotal,
      discount,
      total
    });
    // Don't auto-close, let the user see the receipt
    setCart([]); 
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-brand-bg">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
           <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
             <input 
               ref={searchInputRef}
               type="text" 
               placeholder="Scan barcode or type product name..."
               className="w-full bg-white border border-brand-line rounded-lg pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex bg-white border border-brand-line rounded-lg p-1 shadow-sm">
             <button className="px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-brand-primary text-white">Fast-sell</button>
             <button className="px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider text-brand-slate hover:bg-slate-50">Bulk</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
          {products?.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white border border-brand-line p-4 rounded-xl text-left shadow-sm hover:border-brand-primary transition-all group flex flex-col"
            >
              <div className="flex-1 mb-4 flex items-center justify-center relative">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-brand-primary group-hover:scale-110 transition-all">
                    <Package className="w-8 h-8" />
                 </div>
                 <div className="absolute -top-1 -right-1 bg-brand-primary text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-200">
                    <Plus className="w-3 h-3" />
                 </div>
              </div>
              <h3 className="text-xs font-bold text-brand-ink mb-1 line-clamp-2 leading-snug h-8">{product.name}</h3>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                <span className="text-sm font-black text-brand-ink">₵{product.price.toFixed(2)}</span>
                <span className={cn(
                  "text-[10px] font-black uppercase",
                  product.stock_quantity < 5 ? "text-red-500" : "text-brand-slate opacity-50"
                )}>
                  {product.stock_quantity} left
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[380px] bg-white border-l border-brand-line flex flex-col shadow-xl">
        <div className="p-6 border-b border-brand-line flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-brand-ink flex items-center gap-2">
              Cart Order
              <span className="bg-brand-ink text-white text-[10px] px-1.5 py-0.5 rounded font-black">
                {cart.length}
              </span>
            </h2>
            <p className="text-[10px] font-bold text-brand-slate uppercase tracking-widest mt-0.5">Terminal #01</p>
          </div>
          <button 
            onClick={() => setCart([])}
            className="text-brand-slate hover:text-red-500 transition-colors p-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div 
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-transparent hover:border-brand-line transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-ink truncate">{item.product.name}</p>
                  <p className="text-xs font-medium text-brand-slate">₵{item.product.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-md border border-brand-line p-0.5 shadow-sm">
                  <button 
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 hover:bg-slate-50 rounded text-brand-slate"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-black text-brand-ink">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 hover:bg-slate-50 rounded text-brand-slate"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <p className="text-sm font-black text-brand-ink opacity-30">Scan to begin</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-brand-ink text-white">
          <div className="space-y-2 mb-6 border-b border-white/10 pb-4">
            <div className="flex justify-between items-center text-white/50 text-[10px] font-black uppercase tracking-widest">
              <span>Subtotal</span>
              <span>₵{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                <Percent className="w-3 h-3" />
                <span>Discount</span>
              </div>
              <div className="flex items-center gap-1">
                {[5, 10, 20].map(pct => (
                  <button 
                    key={pct}
                    onClick={() => setDiscount(Math.round(subtotal * (pct/100) * 100) / 100)}
                    className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold hover:bg-white/10 transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-right text-xs font-bold outline-none focus:border-brand-primary transition-colors ml-1"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-end mb-6">
             <span className="text-[11px] font-black uppercase text-white/50 tracking-widest">Grand Total</span>
             <span className="text-3xl font-black tracking-tighter">₵{total.toFixed(2)}</span>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-brand-primary text-white py-4 rounded-lg font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all flex items-center justify-center gap-2"
          >
            Place Order
            <span className="text-[10px] opacity-50 font-normal normal-case">(Shift+Enter)</span>
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-brand-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-brand-line"
            >
              {!isSuccess ? (
                <>
                  <div className="p-8 border-b border-brand-line flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xl font-black text-brand-ink uppercase tracking-tight">Complete Sale</h3>
                    <button 
                      onClick={() => setIsCheckoutOpen(false)}
                      className="p-2 hover:bg-white rounded-full text-brand-slate transition-colors border border-transparent hover:border-brand-line"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={cn(
                          "p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all",
                          paymentMethod === 'cash' ? "border-brand-primary bg-blue-50 text-brand-primary" : "border-slate-100 text-brand-slate hover:border-slate-200"
                        )}
                      >
                        <Banknote className="w-8 h-8" />
                        <span className="text-xs font-black uppercase tracking-wider">Cash Pay</span>
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('momo')}
                        className={cn(
                          "p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all relative overflow-hidden",
                          paymentMethod === 'momo' ? "border-brand-primary bg-blue-50 text-brand-primary" : "border-slate-100 text-brand-slate hover:border-slate-200"
                        )}
                      >
                        <CreditCard className="w-8 h-8" />
                        <span className="text-xs font-black uppercase tracking-wider">MOMO Pay</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[24px] border border-brand-line">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-[11px] font-bold text-brand-slate uppercase tracking-widest">Total Payable</span>
                         <span className="text-3xl font-black text-brand-ink">₵{total.toFixed(2)}</span>
                       </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      className="w-full bg-brand-primary text-white py-5 rounded-[20px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20 hover:brightness-110"
                    >
                      Confirm & Generate Receipt
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 flex flex-col items-center">
                   <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200">
                     <CheckCircle2 className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-black text-brand-ink mb-1">Sale Successful</h3>
                   <p className="text-brand-slate font-medium text-sm mb-8">Transaction recorded and synced</p>

                   {/* Receipt Preview */}
                   <div className="w-full bg-slate-50 border-2 border-dashed border-brand-line rounded-3xl p-8 mb-8 font-mono text-[11px] text-brand-ink relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary" />
                      
                      <div className="text-center mb-6">
                        <img src="/src/assets/images/clemtrix_logo_asset_1779216318559.png" className="h-8 w-auto mx-auto mb-3 opacity-20 grayscale brightness-0" />
                        <h4 className="font-black text-sm uppercase tracking-tighter mb-1">{profile?.business?.name || 'Clemtrix Shop'}</h4>
                        <p className="text-[9px] font-bold text-brand-slate uppercase tracking-widest">Digital POS Receipt</p>
                        <p className="mt-2 text-brand-primary font-black uppercase">Tel: {profile?.whatsapp_number || '+233 00 000 0000'}</p>
                      </div>

                      <div className="border-t border-b border-dashed border-brand-line py-3 mb-4 flex justify-between uppercase">
                         <div>Date: {new Date().toLocaleDateString()}</div>
                         <div>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>

                      <div className="space-y-2 mb-6">
                         {completedOrder?.items.map((item: any) => (
                           <div key={item.product.id} className="flex justify-between items-start">
                              <div className="flex-1 pr-4">
                                <p className="font-bold uppercase tracking-tighter">{item.product.name}</p>
                                <p className="text-[9px] text-brand-slate">{item.quantity} x ₵{item.product.price.toFixed(2)}</p>
                              </div>
                              <div className="font-black">₵{(item.quantity * item.product.price).toFixed(2)}</div>
                           </div>
                         ))}
                      </div>

                      <div className="border-t border-dashed border-brand-line pt-3 space-y-1">
                         <div className="flex justify-between">
                            <span className="uppercase font-bold text-brand-slate">Subtotal</span>
                            <span className="font-black">₵{completedOrder?.subtotal.toFixed(2)}</span>
                         </div>
                         {completedOrder?.discount > 0 && (
                           <div className="flex justify-between text-red-500">
                              <span className="uppercase font-bold">Discount</span>
                              <span className="font-black">-₵{completedOrder?.discount.toFixed(2)}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-base pt-1">
                            <span className="uppercase font-black tracking-widest">Total</span>
                            <span className="font-black border-b-2 border-double border-brand-ink">₵{completedOrder?.total.toFixed(2)}</span>
                         </div>
                      </div>

                      <div className="mt-8 text-center space-y-1 opacity-50">
                        <p className="uppercase font-black tracking-widest">Thank you for your business!</p>
                        <p className="text-[9px]">Items once sold are not returnable</p>
                        <p className="text-[8px] mt-4">Powered by Clemtrix POS</p>
                      </div>

                   </div>

                   <div className="grid grid-cols-2 gap-4 w-full">
                     <button 
                        onClick={() => {
                          setIsCheckoutOpen(false);
                          setIsSuccess(false);
                          setCompletedOrder(null);
                        }}
                        className="py-4 rounded-xl bg-slate-100 text-brand-slate font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                     >
                       Close
                     </button>
                     <button 
                        onClick={() => window.print()}
                        className="py-4 rounded-xl bg-brand-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:brightness-110 flex items-center justify-center gap-2"
                     >
                       <Receipt className="w-4 h-4" />
                       Print Receipt
                     </button>
                   </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
