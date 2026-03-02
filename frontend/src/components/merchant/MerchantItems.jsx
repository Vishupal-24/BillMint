import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Package, PlusCircle, Trash2, Tag, Pencil, Save, X, Search, 
  Filter, Settings, Plus, ChevronDown, Check, AlertCircle, Loader2,
  ToggleLeft, ToggleRight, Image as ImageIcon, RefreshCw, Upload,CheckCircle
  
} from 'lucide-react';
import * as api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { createPortal } from 'react-dom';

const MerchantItems = () => {
  const { isDark } = useTheme();
  
  // ==========================================
  // STATE
  // ==========================================
  
  // Data State
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // Edit State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Form State
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: '#10b981' });
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    unit: 'piece',
    isAvailable: true,
    imageUrl: '',
  });

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast('Image size should be less than 2MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemForm(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // DATA FETCHING
  // ==========================================
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  const fetchData = useCallback(async (dispatchUpdate = false) => {
    try {
      setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        api.fetchCategories(),
        api.fetchItems(),
      ]);
      setCategories(categoriesRes.data || []);
      setItems(itemsRes.data?.items || []);
      
      // Dispatch event to notify other components (like Billing page) of updates
      if (dispatchUpdate) {
        window.dispatchEvent(new Event('merchant-items-updated'));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // CATEGORY OPERATIONS
  // ==========================================
  
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        color: category.color || '#10b981',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: '#10b981' });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', color: '#10b981' });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory._id, categoryForm);
        showToast('Category updated!');
      } else {
        await api.createCategory(categoryForm);
        showToast('Category created!');
      }
      closeCategoryModal();
      fetchData();
    } catch (err) {
      console.error('Save category error:', err);
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const itemCount = items.filter(i => i.categoryId?._id === category._id || i.categoryId === category._id).length;
    
    if (itemCount > 0) {
      const confirmMsg = `"${category.name}" has ${itemCount} items. Delete category and move items to another category?`;
      if (!window.confirm(confirmMsg)) return;
      
      // Find another category to move items to
      const otherCategory = categories.find(c => c._id !== category._id);
      if (!otherCategory) {
        showToast('Cannot delete the only category. Create another first.', 'error');
        return;
      }
      
      try {
        setSaving(true);
        await api.deleteCategory(category._id, otherCategory._id);
        showToast('Category deleted and items moved!');
        fetchData();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete category', 'error');
      } finally {
        setSaving(false);
      }
    } else {
      if (!window.confirm(`Delete "${category.name}"?`)) return;
      
      try {
        setSaving(true);
        await api.deleteCategory(category._id);
        showToast('Category deleted!');
        fetchData();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete category', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  // ==========================================
  // ITEM OPERATIONS
  // ==========================================
  
  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        price: item.price.toString(),
        categoryId: item.categoryId?._id || item.categoryId,
        description: item.description || '',
        unit: item.unit || 'piece',
        isAvailable: item.isAvailable !== false,
        imageUrl: item.imageUrl || '',
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        price: '',
        categoryId: categories[0]?._id || '',
        description: '',
        unit: 'piece',
        isAvailable: true,
        imageUrl: '',
      });
    }
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({
      name: '',
      price: '',
      categoryId: '',
      description: '',
      unit: 'piece',
      isAvailable: true,
      imageUrl: '',
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...itemForm,
        price: parseFloat(itemForm.price),
      };

      if (editingItem) {
        await api.updateItem(editingItem._id, payload);
        showToast('Item updated!');
      } else {
        await api.createItem(payload);
        showToast('Item created!');
      }
      closeItemModal();
      fetchData(true); // Dispatch update event
    } catch (err) {
      console.error('Save item error:', err);
      showToast(err.response?.data?.message || 'Failed to save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      setSaving(true);
      await api.deleteItem(item._id, true);
      showToast('Item deleted!');
      fetchData(true); // Dispatch update event
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.toggleItemAvailability(item._id, !item.isAvailable);
      setItems(items.map(i => 
        i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i
      ));
      // Dispatch update event for billing page
      window.dispatchEvent(new Event('merchant-items-updated'));
      showToast(item.isAvailable ? 'Item marked unavailable' : 'Item marked available');
    } catch (err) {
      showToast('Failed to update availability', 'error');
    }
  };

  // ==========================================
  // FILTERED DATA
  // ==========================================
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (item.categoryId?._id || item.categoryId) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ==========================================
  // RENDER: LOADING STATE
  // ==========================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading inventory...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN UI
  // ==========================================
  
  return (
    <div className={`space-y-6 animate-fade-in max-w-5xl mx-auto pb-20 md:pb-0 ${isDark ? 'text-white' : ''}`}>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-row md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Inventory Manager</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {items.length} items in {categories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className={`p-2 rounded-lg transition-all ${
              isDark 
                ? 'text-slate-400 hover:bg-dark-surface hover:text-slate-300' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${isDark ? 'border-dark-border' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'items'
              ? 'border-emerald-500 text-emerald-600'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-300'
                : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package size={16} className="inline mr-2" />
          Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-600'
              : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-300'
                : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag size={16} className="inline mr-2" />
          Categories ({categories.length})
        </button>
      </div>

      {/* ==========================================
          ITEMS TAB
          ========================================== */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl pl-11 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                  isDark 
                    ? 'bg-dark-card border border-dark-border text-white placeholder-slate-500' 
                    : 'bg-white border border-slate-200'
                }`}
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`appearance-none rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium ${
                  isDark 
                    ? 'bg-dark-card border border-dark-border text-white' 
                    : 'bg-white border border-slate-200'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-3 top-3 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
            </div>

            {/* Add Item Button */}
            <button
              onClick={() => openItemModal()}
              disabled={categories.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <PlusCircle size={18} />
              Add Item
            </button>
          </div>

          {categories.length === 0 && (
            <div className={`text-center py-8 rounded-xl border ${
              isDark 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className={`font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>No categories yet</p>
              <p className={`text-sm ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>Create a category first before adding items</p>
              <button
                onClick={() => setActiveTab('categories')}
                className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600"
              >
                Go to Categories
              </button>
            </div>
          )}

          {/* Items Grid */}
          {filteredItems.length === 0 && categories.length > 0 ? (
            <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${
              isDark 
                ? 'bg-dark-card border-dark-border' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No items found</p>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {searchQuery ? 'Try a different search' : 'Click "Add Item" to create your first item'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className={`hidden md:block rounded-2xl border shadow-sm overflow-hidden ${
                isDark 
                  ? 'bg-dark-card border-dark-border' 
                  : 'bg-white border-slate-100'
              }`}>
                <table className="w-full text-left">
                  <thead className={isDark ? 'bg-dark-surface border-b border-dark-border' : 'bg-slate-50 border-b border-slate-100'}>
                    <tr>
                      <th className={`p-4 text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Item</th>
                      <th className={`p-4 text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Category</th>
                      <th className={`p-4 text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Price</th>
                      <th className={`p-4 text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</th>
                      <th className={`p-4 text-xs font-bold uppercase text-right ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-dark-border' : 'divide-y divide-slate-100'}>
                    {filteredItems.map(item => (
                      <tr key={item._id} className={isDark ? 'hover:bg-dark-surface/50' : 'hover:bg-slate-50/50'}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isDark ? 'bg-dark-surface' : 'bg-slate-100'
                              }`}>
                                <Package size={20} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                              </div>
                            )}
                            <div>
                              <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.name}</p>
                              {item.description && (
                                <p className={`text-xs truncate max-w-[200px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span 
                            className="px-2 py-1 text-xs font-bold rounded-lg"
                            style={{ 
                              backgroundColor: `${item.categoryId?.color || '#10b981'}20`,
                              color: item.categoryId?.color || '#10b981'
                            }}
                          >
                            {item.categoryId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-600">₹{item.price}</span>
                          <span className={`text-xs ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/{item.unit}</span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                              item.isAvailable
                                ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.isAvailable ? (
                              <><ToggleRight size={16} /> Available</>
                            ) : (
                              <><ToggleLeft size={16} /> Unavailable</>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openItemModal(item)}
                              className={`p-2 rounded-lg ${
                                isDark 
                                  ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10' 
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className={`p-2 rounded-lg ${
                                isDark 
                                  ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' 
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredItems.map(item => (
                  <div key={item._id} className={`p-4 rounded-2xl border shadow-sm ${
                    isDark 
                      ? 'bg-dark-card border-dark-border' 
                      : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isDark ? 'bg-dark-surface' : 'bg-slate-100'
                          }`}>
                            <Package size={24} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                          </div>
                        )}
                        <div>
                          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.name}</h3>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ 
                              backgroundColor: `${item.categoryId?.color || '#10b981'}20`,
                              color: item.categoryId?.color || '#10b981'
                            }}
                          >
                            {item.categoryId?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">₹{item.price}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/{item.unit}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                          item.isAvailable
                            ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            : isDark ? 'bg-slate-700 text-slate-400' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isAvailable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => openItemModal(item)}
                        className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className={`p-2 rounded-xl ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==========================================
          CATEGORIES TAB
          ========================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Add Category Button */}
          <div className="flex justify-end">
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
            >
              <PlusCircle size={18} />
              Add Category
            </button>
          </div>

          {/* Categories Grid */}
          {categories.length === 0 ? (
            <div className={`text-center py-12 rounded-2xl border-2 border-dashed ${
              isDark 
                ? 'bg-dark-card border-dark-border' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <Tag className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No categories yet</p>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Click "Add Category" to create your first category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const itemCount = items.filter(i => 
                  (i.categoryId?._id || i.categoryId) === category._id
                ).length;

                return (
                  <div
                    key={category._id}
                    className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all ${
                      isDark 
                        ? 'bg-dark-card border-dark-border' 
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Tag size={24} style={{ color: category.color }} />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openCategoryModal(category)}
                          className={`p-2 rounded-lg ${
                            isDark 
                              ? 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10' 
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className={`p-2 rounded-lg ${
                            isDark 
                              ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' 
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{category.name}</h3>
                    {category.description && (
                      <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{category.description}</p>
                    )}
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          CATEGORY MODAL
          ========================================== */}
      {/* {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl w-full max-w-md shadow-xl ${
            isDark ? 'bg-dark-card' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'border-dark-border' : 'border-slate-100'
            }`}>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={closeCategoryModal} className={`p-2 rounded-lg ${
                isDark ? 'hover:bg-dark-surface' : 'hover:bg-slate-100'
              }`}>
                <X size={20} className={isDark ? 'text-slate-400' : ''} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Beverages"
                  className={`w-full rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none ${
                    isDark 
                      ? 'bg-dark-surface border border-dark-border text-white placeholder-slate-500' 
                      : 'border border-slate-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                  className={`w-full rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none ${
                    isDark 
                      ? 'bg-dark-surface border border-dark-border text-white placeholder-slate-500' 
                      : 'border border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className={`w-12 h-12 rounded-lg cursor-pointer ${isDark ? 'border border-dark-border' : 'border border-slate-200'}`}
                  />
                  <input
                    type="text"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className={`flex-1 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none ${
                      isDark 
                        ? 'bg-dark-surface border border-dark-border text-white' 
                        : 'border border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className={`flex-1 py-3 rounded-xl font-medium ${
                    isDark 
                      ? 'border border-dark-border text-slate-300 hover:bg-dark-surface' 
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !categoryForm.name.trim()}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {showCategoryModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* MODAL CONTAINER 
             - Same logic: mb-24 on mobile to clear bottom nav
             - max-h-[80vh] to avoid full screen takeover
          */}
          <div 
            className={`w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] mb-24 md:mb-0 overflow-hidden animate-scale-up transition-all ${
            isDark ? 'bg-dark-card ring-1 ring-white/10' : 'bg-white'
          }`}>
            
            {/* HEADER */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 z-10 ${
              isDark ? 'border-dark-border bg-dark-card' : 'border-slate-100 bg-white'
            }`}>
              <div>
                <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {editingCategory ? 'Update category details' : 'Organize your items into groups'}
                </p>
              </div>
              <button 
                onClick={closeCategoryModal} 
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-dark-surface text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* SCROLLABLE FORM */}
            <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Beverages"
                  className={`w-full rounded-xl px-4 py-3.5 font-medium outline-none transition-all ${
                    isDark 
                      ? 'bg-dark-surface border border-dark-border text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                  }`}
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Description <span className="text-[10px] font-normal opacity-50 lowercase ml-1">(Optional)</span>
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  className={`w-full rounded-xl px-4 py-3.5 font-medium outline-none resize-none transition-all ${
                    isDark 
                      ? 'bg-dark-surface border border-dark-border text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                  }`}
                />
              </div>

              {/* Color Picker - Professional Style */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Color Tag
                </label>
                <div className={`flex items-center gap-3 p-2 rounded-xl border ${isDark ? 'border-dark-border bg-dark-surface' : 'border-slate-200 bg-slate-50'}`}>
                  
                  {/* Color Circle (Input Wrapper) */}
                  <div className="relative w-12 h-12 shrink-0">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="w-full h-full rounded-lg shadow-sm border border-black/10 transition-transform active:scale-95"
                      style={{ backgroundColor: categoryForm.color }}
                    />
                  </div>

                  {/* Hex Code Input */}
                  <div className="flex-1 relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>HEX</span>
                    <input
                      type="text"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className={`w-full rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm uppercase outline-none transition-all ${
                        isDark 
                          ? 'bg-dark-card border border-dark-border text-white focus:border-emerald-500' 
                          : 'bg-white border border-slate-200 text-slate-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  This color will identify items in this category.
                </p>
              </div>

            </form>

            {/* FOOTER */}
            <div className={`p-4 border-t flex gap-3 shrink-0 ${
              isDark ? 'border-dark-border bg-dark-card' : 'border-slate-100 bg-white'
            }`}>
              <button
                type="button"
                onClick={closeCategoryModal}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  isDark 
                    ? 'bg-dark-surface text-slate-300 hover:bg-slate-800' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={saving || !categoryForm.name.trim()}
                className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==========================================
          ITEM MODAL
          ========================================== */}
      {showItemModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* MODAL CONTAINER 
             - mb-24 md:mb-0: Pushes card up by 96px on mobile to clear bottom nav
             - max-h-[80vh]: Ensures it never fills the whole screen vertically
             - animate-scale-up: smooth entry animation
          */}
          <div 
            className={`w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] mb-24 md:mb-0 overflow-hidden animate-scale-up transition-all ${
            isDark ? 'bg-dark-card ring-1 ring-white/10' : 'bg-white'
          }`}>
            
            {/* HEADER - Sticky & Glassy */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 z-10 ${
              isDark ? 'border-dark-border bg-dark-card' : 'border-slate-100 bg-white'
            }`}>
              <div>
                <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {editingItem ? 'Edit Item' : 'New Item'}
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {editingItem ? 'Update item details' : 'Add a new product to your inventory'}
                </p>
              </div>
              <button 
                onClick={closeItemModal} 
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-dark-surface text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* SCROLLABLE FORM CONTENT */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Image Upload - Redesigned */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className={`w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                    itemForm.imageUrl 
                      ? isDark ? 'border-emerald-500/50' : 'border-emerald-200'
                      : isDark ? 'border-dark-border bg-dark-surface' : 'border-slate-200 bg-slate-50'
                  }`}>
                    {itemForm.imageUrl ? (
                      <img src={itemForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className={`mx-auto mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} size={24} />
                        <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Add Photo</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Trigger Overlay */}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-white font-medium text-xs backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={16} />
                      <span>{itemForm.imageUrl ? 'Change' : 'Upload'}</span>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>

                  {itemForm.imageUrl && (
                    <button 
                      type="button"
                      onClick={() => setItemForm({...itemForm, imageUrl: ''})}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-transform hover:scale-110"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Masala Dosa"
                  className={`w-full rounded-xl px-4 py-3.5 font-medium outline-none transition-all ${
                    isDark 
                      ? 'bg-dark-surface border border-dark-border text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                  }`}
                  required
                />
              </div>

              {/* Price & Unit Row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Price
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>₹</span>
                    <input
                      type="number"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="0"
                      className={`w-full rounded-xl pl-9 pr-4 py-3.5 font-bold outline-none transition-all ${
                        isDark 
                          ? 'bg-dark-surface border border-dark-border text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      value={itemForm.unit}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      className={`w-full appearance-none rounded-xl px-4 py-3.5 font-medium outline-none transition-all ${
                        isDark 
                          ? 'bg-dark-surface border border-dark-border text-white focus:border-emerald-500' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500'
                      }`}
                    >
                      <option value="piece">Piece</option>
                      <option value="plate">Plate</option>
                      <option value="kg">Kg</option>
                      <option value="g">Gram</option>
                      <option value="l">Ltr</option>
                      <option value="ml">ML</option>
                      <option value="cup">Cup</option>
                      <option value="glass">Glass</option>
                      <option value="pack">Pack</option>
                    </select>
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Category
                </label>
                <div className="relative">
                  <select
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className={`w-full appearance-none rounded-xl px-4 py-3.5 font-medium outline-none transition-all ${
                      isDark 
                        ? 'bg-dark-surface border border-dark-border text-white focus:border-emerald-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500'
                    }`}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Availability Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${itemForm.isAvailable ? 'bg-emerald-100 text-emerald-600' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Available for Sale</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Show this item in billing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, isAvailable: !itemForm.isAvailable })}
                  className={`w-11 h-6 rounded-full transition-all relative ${
                    itemForm.isAvailable ? 'bg-emerald-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                    itemForm.isAvailable ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

            </form>

            {/* FOOTER - Always visible */}
            <div className={`p-4 border-t flex gap-3 shrink-0 ${
              isDark ? 'border-dark-border bg-dark-card' : 'border-slate-100 bg-white'
            }`}>
              <button
                type="button"
                onClick={closeItemModal}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  isDark 
                    ? 'bg-dark-surface text-slate-300 hover:bg-slate-800' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={saving || !itemForm.name.trim() || !itemForm.price || !itemForm.categoryId}
                className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
          {/* Internal Animations for this Modal */}
          <style>{`
            @keyframes scale-up {
              0% { opacity: 0; transform: scale(0.95) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
          `}</style>
        </div>,
        document.body
      )}

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
