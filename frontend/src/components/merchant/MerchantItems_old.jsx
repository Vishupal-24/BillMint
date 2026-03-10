import React, { useState } from 'react';
import { 
  Package, PlusCircle, Trash2, Tag, Pencil, Save, X, Search, 
  Filter, Settings, Plus, ChevronDown, Check, AlertCircle 
} from 'lucide-react';
import api from '../../services/api';

const MerchantItems = ({ inventory, setInventory, categories = [], setCategories }) => {
  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  
  // Edit & Search State
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Category Management State
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Show toast helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // 🧠 DERIVED: Filter items
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get unique categories from inventory
  const inventoryCategories = [...new Set(inventory.map(i => i.category).filter(Boolean))];
  
  // Merge with merchant's custom categories
  const allCategories = [...new Set([...categories, ...inventoryCategories])];

  // 🔹 CATEGORY MANAGEMENT
  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    
    if (categories.includes(trimmed)) {
      setCategoryError("Category already exists");
      return;
    }
    
    if (trimmed.length > 50) {
      setCategoryError("Category name too long (max 50 characters)");
      return;
    }

    const updatedCategories = [...categories, trimmed];
    
    try {
      setSavingCategories(true);
      await api.patch('/auth/me', { categories: updatedCategories });
      setCategories(updatedCategories);
      setNewCategory("");
      setCategoryError("");
      showToast(`"${trimmed}" category added!`);
    } catch (err) {
      setCategoryError("Failed to save category");
    } finally {
      setSavingCategories(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    // Check if category is in use
    const itemsWithCategory = inventory.filter(i => i.category === cat);
    if (itemsWithCategory.length > 0) {
      if (!window.confirm(`"${cat}" is used by ${itemsWithCategory.length} item(s). Delete anyway?`)) {
        return;
      }
    }
    
    const updatedCategories = categories.filter(c => c !== cat);
    
    try {
      setSavingCategories(true);
      await api.patch('/auth/me', { categories: updatedCategories });
      setCategories(updatedCategories);
      showToast(`"${cat}" category removed`);
    } catch (err) {
      showToast("Failed to remove category", "error");
    } finally {
      setSavingCategories(false);
    }
  };

  // 🔹 ITEM ACTIONS
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !category) return;

    if (editingId) {
      // Update
      setInventory(inventory.map(item => {
        if (item.id === editingId) {
          return { ...item, name, price: parseFloat(price), category: category.trim() };
        }
        return item;
      }));
      showToast("Item updated!");
      resetForm();
    } else {
      // Add
      setInventory([{ 
        id: Date.now(), 
        name, 
        price: parseFloat(price),
        category: category.trim() 
      }, ...inventory]);
      showToast("Item added!");
      resetForm();
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price);
    setCategory(item.category || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this item?")) {
      setInventory(inventory.filter(i => i.id !== id));
      if (editingId === id) resetForm();
      showToast("Item deleted");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setCategory("");
    setCategoryDropdownOpen(false);
  };

  const selectCategory = (cat) => {
    setCategory(cat);
    setCategoryDropdownOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20 md:pb-0">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-2 mb-2">
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Menu Manager</h2>
          <p className="text-slate-500 text-xs md:text-sm">Manage your shop's items and categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showCategoryManager 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Settings size={16} />
            <span className="hidden md:inline">Manage Categories</span>
            <span className="md:hidden">Categories</span>
          </button>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase">Total Items</p>
            <p className="text-slate-800 font-medium">{inventory.length}</p>
          </div>
        </div>
      </div>

      {/* 2. Category Manager Panel */}
      {showCategoryManager && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
              📁 Your Categories
            </h3>
            <button 
              onClick={() => setShowCategoryManager(false)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Add New Category */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-2.5 text-emerald-400" size={16} />
              <input
                type="text"
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setCategoryError(""); }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-full bg-white border border-emerald-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={50}
              />
            </div>
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || savingCategories}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          
          {categoryError && (
            <p className="text-red-500 text-xs font-medium flex items-center gap-1">
              <AlertCircle size={12} /> {categoryError}
            </p>
          )}
          
          {/* Category List */}
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-emerald-600 text-sm opacity-70">No custom categories yet. Add one above!</p>
            ) : (
              categories.map(cat => {
                const itemCount = inventory.filter(i => i.category === cat).length;
                return (
                  <div 
                    key={cat}
                    className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-200 group hover:border-red-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700">{cat}</span>
                    <span className="text-xs text-slate-400">({itemCount})</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      disabled={savingCategories}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="Remove category"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          
          <p className="text-xs text-emerald-600 opacity-70">
            💡 Categories help organize your menu items. You can add up to 20 categories.
          </p>
        </div>
      )}

      {/* 3. FORM CARD (Add / Edit) */}
      <div className={`
        p-4 md:p-6 rounded-2xl border shadow-sm transition-all duration-300
        ${editingId ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-100'}
      `}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${editingId ? 'text-blue-600' : 'text-slate-400'}`}>
            {editingId ? 'Editing Item...' : 'Add New Item'}
          </h3>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
              <X size={12} /> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
          
          <div className="flex-1 relative">
            <Package className={`absolute left-4 top-3.5 ${editingId ? 'text-blue-400' : 'text-slate-400'}`} size={18} />
            <input 
              className={`w-full border rounded-xl pl-11 pr-4 py-3 outline-none font-medium text-sm transition-all ${editingId ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} 
              placeholder="Item Name" 
              value={name} onChange={e => setName(e.target.value)} required 
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-56 relative">
            <Tag className={`absolute left-4 top-3.5 z-10 ${editingId ? 'text-blue-400' : 'text-slate-400'}`} size={18} />
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`w-full border rounded-xl pl-11 pr-10 py-3 outline-none font-medium text-sm transition-all text-left ${
                editingId 
                  ? 'bg-white border-blue-200' 
                  : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
              } ${category ? 'text-slate-800' : 'text-slate-400'}`}
            >
              {category || "Select Category"}
            </button>
            <ChevronDown 
              className={`absolute right-4 top-3.5 text-slate-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} 
              size={18} 
            />
            
            {/* Dropdown Menu */}
            {categoryDropdownOpen && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                {allCategories.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-400">
                    No categories. Add one above!
                  </div>
                ) : (
                  allCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-emerald-50 flex items-center justify-between ${
                        category === cat ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      <span>{cat}</span>
                      {category === cat && <Check size={16} className="text-emerald-600" />}
                    </button>
                  ))
                )}
                
                {/* Quick add category option */}
                <button
                  type="button"
                  onClick={() => { setShowCategoryManager(true); setCategoryDropdownOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 border-t border-slate-100 flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add New Category...
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 md:w-32 relative">
                <span className={`absolute left-4 top-3.5 font-bold ${editingId ? 'text-blue-400' : 'text-slate-400'}`}>₹</span>
                <input 
                className={`w-full border rounded-xl pl-8 pr-4 py-3 outline-none font-bold text-sm transition-all ${editingId ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} 
                type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required 
                />
            </div>

            <button 
              type="submit"
              className={`px-4 md:px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
                {editingId ? <Save size={20} /> : <PlusCircle size={20} />}
                <span className="hidden md:inline">{editingId ? 'Update' : 'Add'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Click outside to close dropdown */}
      {categoryDropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setCategoryDropdownOpen(false)}
        />
      )}

      {/* 4. SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
        <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter Pills */}
      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSearchQuery("")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              !searchQuery ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({inventory.length})
          </button>
          {allCategories.map(cat => {
            const count = inventory.filter(i => i.category === cat).length;
            const isActive = searchQuery.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSearchQuery(isActive ? "" : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 5. CONTENT AREA (Responsive Switch) */}
      
      {/* 🅰️ DESKTOP VIEW: Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Item Name</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Category</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase">Price</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    <Filter size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No items found.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50/50 ${editingId === item.id ? 'bg-blue-50/30' : ''}`}>
                    <td className="p-4 font-bold text-slate-700">{item.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">₹{item.price}</td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
        </table>
      </div>

      {/* 🅱️ MOBILE VIEW: Cards List */}
      <div className="md:hidden space-y-3">
        {filteredInventory.length === 0 ? (
             <div className="text-center py-10 text-slate-400 flex flex-col items-center opacity-60">
                 <Filter size={32} className="mb-2"/>
                 <p>No items found.</p>
             </div>
        ) : (
            filteredInventory.map(item => (
                <div 
                    key={item.id} 
                    className={`
                        bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all
                        ${editingId === item.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-100'}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wide">
                                {item.category}
                            </span>
                        </div>
                        <div className="text-xl font-bold text-emerald-600">
                            ₹{item.price}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-1">
                        <button 
                            onClick={() => handleEditClick(item)}
                            className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Pencil size={16} /> Edit
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>

    </div>
  );
};

export default MerchantItems;