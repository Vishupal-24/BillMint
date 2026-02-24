import React, { useState } from 'react';
import { Package, PlusCircle, Trash2, Tag, Pencil, Save, X, Search, Filter } from 'lucide-react';

const MerchantItems = ({ inventory, setInventory }) => {
  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  
  // Edit & Search State
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 🧠 DERIVED: Filter items
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 🔹 ACTIONS
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
      resetForm();
    } else {
      // Add
      setInventory([{ 
        id: Date.now(), 
        name, 
        price: parseFloat(price),
        category: category.trim() 
      }, ...inventory]);
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
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setCategory("");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20 md:pb-0">
      
      {/* 1. Header (Centered Text) */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-2 mb-2">
        <div className="text-center md:text-left"> {/* 👈 Added text-center here */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Menu Manager</h2>
          <p className="text-slate-500 text-xs md:text-sm">Manage your shop's items and prices.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Items</p>
          <p className="text-slate-800 font-medium">{inventory.length}</p>
        </div>
      </div>

      {/* 2. FORM CARD (Add / Edit) */}
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

          <div className="w-full md:w-48 relative">
            <Tag className={`absolute left-4 top-3.5 ${editingId ? 'text-blue-400' : 'text-slate-400'}`} size={18} />
            <input 
              className={`w-full border rounded-xl pl-11 pr-4 py-3 outline-none font-medium text-sm transition-all ${editingId ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} 
              placeholder="Category" 
              value={category} onChange={e => setCategory(e.target.value)} list="category-suggestions" required 
            />
            <datalist id="category-suggestions">{[...new Set(inventory.map(i => i.category))].map(c => <option key={c} value={c} />)}</datalist>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 md:w-32 relative">
                <span className={`absolute left-4 top-3.5 font-bold ${editingId ? 'text-blue-400' : 'text-slate-400'}`}>₹</span>
                <input 
                className={`w-full border rounded-xl pl-8 pr-4 py-3 outline-none font-bold text-sm transition-all ${editingId ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} 
                type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} required 
                />
            </div>

            <button className={`px-4 md:px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {editingId ? <Save size={20} /> : <PlusCircle size={20} />}
                <span className="hidden md:inline">{editingId ? 'Update' : 'Add'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. SEARCH BAR */}
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

      {/* 4. CONTENT AREA (Responsive Switch) */}
      
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
              {filteredInventory.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/50 ${editingId === item.id ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-4 font-bold text-slate-700">{item.name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg uppercase">{item.category}</span></td>
                  <td className="p-4 text-slate-500 font-medium">₹{item.price}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
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

    </div>
  );
};

export default MerchantItems;