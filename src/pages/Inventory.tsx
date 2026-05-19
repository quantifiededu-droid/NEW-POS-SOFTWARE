import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { 
  Plus, 
  Search, 
  Package,
  MessageCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../hooks/useAuth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Inventory() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Bulk edit states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<'price' | 'stock' | 'status' | null>(null);
  const [bulkValue, setBulkValue] = useState('');
  const [bulkMode, setBulkMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [bulkStatusValue, setBulkStatusValue] = useState<boolean>(true);
  
  const products = useLiveQuery(() => 
    db.products.where('name').startsWithIgnoreCase(searchTerm).toArray()
  , [searchTerm]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost_price: '0',
    stock_quantity: '',
    min_stock_level: '10',
    barcode: '',
    image_url: ''
  });

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost_price: product.cost_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      barcode: product.barcode,
      image_url: product.image_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.business_id) {
      alert("You must be logged in to a business to manage products.");
      return;
    }

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price),
      stock_quantity: parseInt(formData.stock_quantity),
      min_stock_level: parseInt(formData.min_stock_level),
      barcode: formData.barcode || (editingProduct ? editingProduct.barcode : uuidv4().slice(0, 8)),
      image_url: formData.image_url,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (editingProduct) {
      const updatedProduct = { ...editingProduct, ...productData };
      await db.products.update(editingProduct.id, updatedProduct);
      await db.syncQueue.add({
        type: 'product_update',
        data: { product: updatedProduct },
        created_at: Date.now()
      });
      setIsEditModalOpen(false);
    } else {
      const newProduct = {
        id: uuidv4(),
        business_id: profile.business_id,
        ...productData
      };
      await db.products.add(newProduct);
      await db.syncQueue.add({
        type: 'product_update',
        data: { product: newProduct },
        created_at: Date.now()
      });
      setIsAddModalOpen(false);
    }
    
    setFormData({ name: '', price: '', cost_price: '0', stock_quantity: '', min_stock_level: '10', barcode: '', image_url: '' });
    setEditingProduct(null);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const selectedProducts = products?.filter(p => selectedIds.includes(p.id)) || [];

    for (const product of selectedProducts) {
      let updatedProduct = { ...product };

      if (bulkActionType === 'price') {
        const val = parseFloat(bulkValue);
        if (!isNaN(val)) {
          if (bulkMode === 'add') {
            updatedProduct.price = Math.max(0, product.price + val);
          } else if (bulkMode === 'subtract') {
            updatedProduct.price = Math.max(0, product.price - val);
          } else {
            updatedProduct.price = Math.max(0, val);
          }
        }
      } else if (bulkActionType === 'stock') {
        const val = parseInt(bulkValue);
        if (!isNaN(val)) {
          if (bulkMode === 'add') {
            updatedProduct.stock_quantity = Math.max(0, product.stock_quantity + val);
          } else if (bulkMode === 'subtract') {
            updatedProduct.stock_quantity = Math.max(0, product.stock_quantity - val);
          } else {
            updatedProduct.stock_quantity = Math.max(0, val);
          }
        }
      } else if (bulkActionType === 'status') {
        updatedProduct.is_active = bulkStatusValue;
      }

      updatedProduct.updated_at = new Date().toISOString();

      // Persist to Dexie
      await db.products.update(product.id, updatedProduct);

      // Push to Sync Queue
      await db.syncQueue.add({
        type: 'product_update',
        data: { product: updatedProduct },
        created_at: Date.now()
      });
    }

    setBulkActionType(null);
    setBulkValue('');
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected products?`)) return;

    for (const id of selectedIds) {
      await db.products.delete(id);
      await db.syncQueue.add({
        type: 'product_delete',
        data: { id },
        created_at: Date.now()
      });
    }

    setBulkActionType(null);
    setSelectedIds([]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-brand-ink tracking-tight">Inventory Stock</h1>
          <p className="text-sm font-medium text-brand-slate">Manage 742 individual items across your store</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
             <input 
               type="text" 
               placeholder="Search inventory..." 
               className="bg-white border border-brand-line rounded-lg pl-9 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all w-64"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="bg-brand-primary text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
           >
             <Plus className="w-4 h-4" />
             New Product
           </button>
        </div>
      </div>

      <div className="bg-white border border-brand-line rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-brand-line">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-4 w-4 cursor-pointer"
                    checked={products && products.length > 0 && selectedIds.length === products.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(products?.map(p => p.id) || []);
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Product Name</th>
                <th className="text-left px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Category</th>
                <th className="text-right px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Price (GHS)</th>
                <th className="text-right px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Stock Level</th>
                <th className="text-right px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {products?.map((product) => (
                <tr 
                  key={product.id} 
                  className={cn(
                    "hover:bg-slate-50 transition-colors cursor-pointer group",
                    selectedIds.includes(product.id) && "bg-blue-50/40 hover:bg-blue-50/60"
                  )}
                  onClick={() => handleEditClick(product)}
                >
                  <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary h-4 w-4 cursor-pointer"
                      checked={selectedIds.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(prev => [...prev, product.id]);
                        } else {
                          setSelectedIds(prev => prev.filter(id => id !== product.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      {product.image_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-brand-line flex-shrink-0 bg-slate-100">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-brand-line flex items-center justify-center bg-slate-50 flex-shrink-0">
                          <Package className="w-5 h-5 text-brand-slate/40" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-brand-ink text-sm">{product.name}</p>
                        <p className="text-[10px] font-mono text-brand-slate uppercase mt-0.5">Barcode: {product.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold text-brand-slate bg-slate-100 px-2 py-0.5 rounded">Provisions</span>
                  </td>
                  <td className="px-8 py-4 text-right font-bold text-brand-ink text-sm">
                    {product.price.toFixed(2)}
                  </td>
                  <td className="px-8 py-4 text-right font-black text-brand-ink text-sm">
                    {product.stock_quantity}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {!product.is_active ? (
                        <span className="px-3 py-1 rounded text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
                          Deactivated
                        </span>
                      ) : (
                        <span className={cn(
                          "px-3 py-1 rounded text-[10px] font-black uppercase tracking-wide",
                          product.stock_quantity <= product.min_stock_level 
                            ? "bg-red-50 text-red-600" 
                            : "bg-green-50 text-green-700"
                        )}>
                          {product.stock_quantity <= product.min_stock_level ? 'Low Stock' : 'In Stock'}
                        </span>
                      )}
                      {product.is_active && product.stock_quantity <= product.min_stock_level && (profile?.business?.plan === 'ai' || profile?.business?.plan === 'medium') && (
                        <span className="text-[8px] font-bold text-green-600 flex items-center gap-1 uppercase tracking-tighter">
                          <MessageCircle className="w-2.5 h-2.5" />
                          WhatsApp Sent
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products?.length === 0 && (
            <div className="p-20 text-center">
              <Package className="w-16 h-16 text-brand-line mx-auto mb-4" />
              <p className="text-lg font-black text-brand-ink">Inventory is empty</p>
              <p className="text-sm text-brand-slate">Items you add will appear here</p>
            </div>
          )}
        </div>
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-2xl p-8 border border-brand-line shadow-2xl">
            <h2 className="text-2xl font-black text-brand-ink mb-6">
              {editingProduct ? 'Edit Product' : 'New Inventory Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Product Name</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="w-24 h-24 relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleImageChange}
                    />
                    <div className="w-full h-full rounded-xl border-2 border-dashed border-brand-line flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors overflow-hidden">
                      {formData.image_url ? (
                        <img src={formData.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5 text-brand-slate/40 mb-1" />
                          <span className="text-[8px] font-bold text-brand-slate/60 uppercase">Add Image</span>
                        </>
                      )}
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Selling Price</label>
                   <input 
                     required type="number" step="0.01"
                     className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                     value={formData.price}
                     onChange={e => setFormData({...formData, price: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Barcode (Optional)</label>
                   <input 
                     type="text"
                     className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                     value={formData.barcode}
                     onChange={e => setFormData({...formData, barcode: e.target.value})}
                     placeholder="Auto-generated if empty"
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Quantity Available</label>
                   <input 
                     required type="number"
                     className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                     value={formData.stock_quantity}
                     onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Minimum Stock Level</label>
                   <input 
                     required type="number"
                     className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                     value={formData.min_stock_level}
                     onChange={e => setFormData({...formData, min_stock_level: e.target.value})}
                   />
                 </div>
               </div>
               <div className="flex gap-4 pt-4">
                 <button 
                   type="button"
                   onClick={() => {
                     setIsAddModalOpen(false);
                     setIsEditModalOpen(false);
                     setEditingProduct(null);
                     setFormData({ name: '', price: '', cost_price: '0', stock_quantity: '', min_stock_level: '10', barcode: '', image_url: '' });
                   }}
                   className="flex-1 py-3 font-bold text-brand-slate hover:bg-slate-50 rounded-lg transition-colors border border-brand-line"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   className="flex-1 py-3 font-bold bg-brand-primary text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
                 >
                   {editingProduct ? 'Save Changes' : 'Add to Stock'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Edit Control Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-ink text-white px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl z-40 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full text-white/90">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs font-semibold text-white/60">Bulk Actions:</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setBulkActionType('price');
                setBulkMode('set');
                setBulkValue('');
              }}
              className="px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"
            >
              Update Price
            </button>
            <button 
              onClick={() => {
                setBulkActionType('stock');
                setBulkMode('set');
                setBulkValue('');
              }}
              className="px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"
            >
              Update Stock
            </button>
            <button 
              onClick={() => {
                setBulkActionType('status');
                setBulkStatusValue(true);
              }}
              className="px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors"
            >
              Toggle Status
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-colors"
            >
              Delete Selected
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <button 
            onClick={() => setSelectedIds([])}
            className="text-xs text-white/40 hover:text-white font-bold transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Bulk Edit Action Dialog */}
      {bulkActionType && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 border border-brand-line shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-black text-brand-ink mb-1">
              Bulk Adjust {bulkActionType === 'price' ? 'Prices' : bulkActionType === 'stock' ? 'Stock Levels' : 'Status'}
            </h2>
            <p className="text-xs text-brand-slate font-medium mb-6">
              This action will update {selectedIds.length} selected items.
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-5">
              {bulkActionType === 'status' ? (
                <div>
                  <label className="block text-[11px] font-bold text-brand-slate uppercase mb-3">Product Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBulkStatusValue(true)}
                      className={cn(
                        "py-3 rounded-lg border text-sm font-bold transition-all",
                        bulkStatusValue 
                          ? "border-green-600 bg-green-50 text-green-700" 
                          : "border-brand-line hover:bg-slate-50 text-brand-slate"
                      )}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkStatusValue(false)}
                      className={cn(
                        "py-3 rounded-lg border text-sm font-bold transition-all",
                        !bulkStatusValue 
                          ? "border-slate-400 bg-slate-100 text-slate-700" 
                          : "border-brand-line hover:bg-slate-50 text-brand-slate"
                      )}
                    >
                      Deactivated
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-brand-slate uppercase mb-3">Adjustment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkMode('set')}
                        className={cn(
                          "py-2 rounded-lg border text-xs font-bold transition-all",
                          bulkMode === 'set' 
                            ? "border-brand-primary bg-blue-50 text-brand-primary" 
                            : "border-brand-line hover:bg-slate-50 text-brand-slate"
                        )}
                      >
                        Set Value
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkMode('add')}
                        className={cn(
                          "py-2 rounded-lg border text-xs font-bold transition-all",
                          bulkMode === 'add' 
                            ? "border-brand-primary bg-blue-50 text-brand-primary" 
                            : "border-brand-line hover:bg-slate-50 text-brand-slate"
                        )}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkMode('subtract')}
                        className={cn(
                          "py-2 rounded-lg border text-xs font-bold transition-all",
                          bulkMode === 'subtract' 
                            ? "border-brand-primary bg-blue-50 text-brand-primary" 
                            : "border-brand-line hover:bg-slate-50 text-brand-slate"
                        )}
                      >
                        Subtract
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">
                      Value {bulkActionType === 'price' ? '(GHS)' : '(Units)'}
                    </label>
                    <input 
                      required
                      type="number"
                      step={bulkActionType === 'price' ? '0.01' : '1'}
                      min="0"
                      className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                      value={bulkValue}
                      onChange={e => setBulkValue(e.target.value)}
                      placeholder={bulkMode === 'set' ? 'Enter target value' : 'Enter adjustment amount'}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setBulkActionType(null);
                    setBulkValue('');
                  }}
                  className="flex-1 py-3 font-bold text-brand-slate hover:bg-slate-50 rounded-lg transition-colors border border-brand-line text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 font-bold bg-brand-primary text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors text-sm"
                >
                  Apply Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
