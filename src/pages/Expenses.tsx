import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Trash2, 
  Receipt,
  Search,
  Calendar,
  DollarSign,
  Tag,
  Filter,
  Check,
  Edit2,
  Trash,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORIES = [
  'Inventory / Stock',
  'Salaries & Wages',
  'Rent & Lease',
  'Utilities (Power, Water, Net)',
  'Marketing & Promo',
  'Logistics & Fuel',
  'Maintenance & Repairs',
  'Other / Miscellaneous'
];

export default function Expenses() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Bulk operation states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState(CATEGORIES[4]);

  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    customCategory: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const expenses = useLiveQuery(() => {
    if (!profile?.business_id) return [];
    return db.expenses.where('business_id').equals(profile.business_id).toArray();
  }, [profile?.business_id]);

  // Filters
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.business_id) return;

    const chosenCategory = formData.category === 'Other (Write custom)'
      ? (formData.customCategory.trim() || 'Other')
      : formData.category;

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExpense = {
      id: uuidv4(),
      business_id: profile.business_id,
      user_id: profile.id,
      category: chosenCategory,
      amount: parsedAmount,
      description: formData.description.trim() || undefined,
      date: formData.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    // Dexie
    await db.expenses.add(newExpense);

    // Sync Queue
    await db.syncQueue.add({
      type: 'expense',
      data: { expense: newExpense },
      created_at: Date.now()
    });

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.business_id || !editingExpense) return;

    const chosenCategory = formData.category === 'Other (Write custom)'
      ? (formData.customCategory.trim() || 'Other')
      : formData.category;

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const updatedExpense = {
      ...editingExpense,
      category: chosenCategory,
      amount: parsedAmount,
      description: formData.description.trim() || undefined,
      date: formData.date
    };

    // Dexie Put
    await db.expenses.put(updatedExpense);

    // Sync Queue
    await db.syncQueue.add({
      type: 'expense',
      data: { expense: updatedExpense },
      created_at: Date.now()
    });

    setIsEditModalOpen(false);
    setEditingExpense(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    await db.expenses.delete(id);
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected expenses?`)) return;

    for (const id of selectedIds) {
      await db.expenses.delete(id);
    }
    setSelectedIds([]);
  };

  const handleBulkCategoryApply = async () => {
    if (selectedIds.length === 0) return;

    for (const id of selectedIds) {
      const expense = expenses?.find(e => e.id === id);
      if (expense) {
        const updatedExpense = { ...expense, category: bulkCategoryValue };
        await db.expenses.put(updatedExpense);
        await db.syncQueue.add({
          type: 'expense',
          data: { expense: updatedExpense },
          created_at: Date.now()
        });
      }
    }

    setSelectedIds([]);
    setShowBulkCategoryModal(false);
  };

  const resetForm = () => {
    setFormData({
      category: CATEGORIES[0],
      customCategory: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditClick = (expense: any) => {
    setEditingExpense(expense);
    const isStandard = CATEGORIES.includes(expense.category);
    setFormData({
      category: isStandard ? expense.category : 'Other (Write custom)',
      customCategory: isStandard ? '' : expense.category,
      amount: expense.amount.toString(),
      description: expense.description || '',
      date: expense.date
    });
    setIsEditModalOpen(true);
  };

  // Statistics
  const totalSpend = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categorySpend = filteredExpenses.reduce((acc: Record<string, number>, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const largestCategory = Object.keys(categorySpend).reduce((a, b) => 
    categorySpend[a] > categorySpend[b] ? a : b
  , 'None');

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      {/* Upper header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-brand-ink tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-brand-primary" />
            <span>Business Expenses</span>
          </h1>
          <p className="text-xs text-brand-slate font-medium mt-1">
            Track and log your business expenditures, inventory bills, and operational overhead.
          </p>
        </div>

        <button 
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="bg-brand-primary hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Metrics Summary Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-slate uppercase tracking-wider">Total logged spend</p>
            <h3 className="text-2xl font-black text-brand-ink mt-0.5">GHS {totalSpend.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-slate uppercase tracking-wider">Top expend category</p>
            <h3 className="text-base font-black text-brand-ink mt-0.5 truncate max-w-[200px]">
              {largestCategory === 'None' ? 'N/A' : largestCategory}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-line shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-slate uppercase tracking-wider">Expenditure Entries</p>
            <h3 className="text-2xl font-black text-brand-ink mt-0.5">{filteredExpenses.length} Records</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-line shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate w-4 h-4" />
          <input 
            type="text"
            className="w-full bg-slate-50 border border-brand-line rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-brand-ink outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all placeholder:text-brand-slate/60"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search description/category..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
          <span className="text-xs font-bold text-brand-slate whitespace-nowrap hidden sm:inline-block">Filter category:</span>
          <select 
            className="bg-slate-50 border border-brand-line rounded-xl px-4 py-2 text-xs font-semibold text-brand-ink outline-none focus:ring-2 focus:ring-brand-primary/10"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Ledger grid & table */}
      <div className="flex-1 bg-white border border-brand-line rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-brand-line">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary/10 h-4 w-4 cursor-pointer"
                    checked={filteredExpenses.length > 0 && selectedIds.length === filteredExpenses.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredExpenses.map(item => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Date</th>
                <th className="text-left px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Category</th>
                <th className="text-left px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Description</th>
                <th className="text-right px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider">Amount</th>
                <th className="text-center px-8 py-4 text-[11px] font-bold text-brand-slate uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-brand-slate text-xs font-semibold">
                    <Receipt className="w-12 h-12 text-brand-slate/40 mx-auto mb-3 stroke-1" />
                    No expense items matched your current entries.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const isChecked = selectedIds.includes(expense.id);
                  return (
                    <tr 
                      key={expense.id}
                      className={cn(
                        "hover:bg-slate-50/50 transition-colors group",
                        isChecked && "bg-blue-50/30 hover:bg-blue-50/50"
                      )}
                    >
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary/10 h-4 w-4 cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, expense.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== expense.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-8 py-4 text-xs font-bold text-brand-ink">
                        {expense.date}
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#1e293b]/5 text-[#1e293b] tracking-wide border border-[#1e293b]/10">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-xs text-brand-slate font-medium max-w-sm truncate">
                        {expense.description || <span className="text-brand-slate/40 italic">No description spec</span>}
                      </td>
                      <td className="px-8 py-4 text-right text-xs font-black text-brand-ink">
                        GHS {expense.amount.toFixed(2)}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(expense)}
                            className="p-1 px-2.5 hover:bg-slate-100 rounded text-brand-slate hover:text-brand-ink text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(expense.id)}
                            className="p-1 px-2.5 hover:bg-red-50 rounded text-brand-slate hover:text-red-600 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bulk Edit Control Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-ink text-white px-6 py-4 rounded-2xl flex items-center gap-6 shadow-2xl z-40 border border-white/15 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full text-white/90">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs font-semibold text-white/65">Bulk Category Action:</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setBulkCategoryValue(CATEGORIES[4]);
                setShowBulkCategoryModal(true);
              }}
              className="px-4 py-2 bg-brand-primary/95 hover:bg-brand-primary text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              Re-categorize Block
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold transition-colors"
            >
              Delete Records
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <button 
            onClick={() => setSelectedIds([])}
            className="text-xs text-white/40 hover:text-white font-bold transition-colors"
          >
            Clear Selected
          </button>
        </div>
      )}

      {/* Re-categorize Bulk Modal */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 border border-brand-line shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-brand-ink mb-1">Bulk Re-Categorize</h3>
            <p className="text-xs text-brand-slate font-medium mb-6">
              This updates {selectedIds.length} select expense entries instantly.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">New Category Code</label>
                <select 
                  className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand-primary/10 outline-none"
                  value={bulkCategoryValue}
                  onChange={e => setBulkCategoryValue(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowBulkCategoryModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-brand-slate hover:bg-slate-50 rounded-lg transition-colors border border-brand-line"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleBulkCategoryApply}
                  className="flex-1 py-3 text-xs font-bold bg-brand-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Apply Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Dual Modals */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 border border-brand-line shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-xl font-black text-brand-ink mb-1">
              {isAddModalOpen ? 'Create Expense Log' : 'Update Expense Entry'}
            </h2>
            <p className="text-xs text-brand-slate font-medium mb-6">
              {isAddModalOpen 
                ? 'Fill this form to log a business bill, payout, or stock purchase overhead.' 
                : 'Alter configuration details below and save values to update entry.'
              }
            </p>

            <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Expense Category</label>
                <select 
                  className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other (Write custom)">Other (Write custom)</option>
                </select>
              </div>

              {formData.category === 'Other (Write custom)' && (
                <div>
                  <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Write Custom Category</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none placeholder:text-brand-slate/40"
                    value={formData.customCategory}
                    onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                    placeholder="E.g. Taxes, Professional Fees..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Amount (GHS)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Date</label>
                  <input 
                    required
                    type="date"
                    className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-slate uppercase mb-2">Description / Note</label>
                <textarea 
                  className="w-full bg-slate-50 border border-brand-line rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none placeholder:text-brand-slate/40 min-h-[80px]"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="E.g. Purchased espresso beans bulk load..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                  className="flex-1 py-3 font-bold text-brand-slate hover:bg-slate-50 rounded-lg transition-all border border-brand-line text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 font-bold bg-brand-primary hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all text-sm"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
