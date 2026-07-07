import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

type InventoryItem = {
  id: string;
  sku: string;
  item_name: string;
  category: string;
  supplier: string;
  unit_of_measure: string;
  stock: number;
  rop: number;
  max_stock: number;
  unit_price: number;
  abc_class: string;
  criticality: string;
  warehouse: string;
  created_by: string;
  created_at: string;
};

export default function Stock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const [newItem, setNewItem] = useState({
    sku: '',
    item_name: '',
    category: 'MRO Spares',
    supplier: '',
    unit_of_measure: 'pcs',
    stock: 0,
    rop: 0,
    max_stock: 0,
    unit_price: 0,
    abc_class: 'A',
    criticality: 'Vital',
    warehouse: 'PHRC-WH-03',
  });

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInventoryData(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetNewItem = () => {
    setNewItem({
      sku: '',
      item_name: '',
      category: 'MRO Spares',
      supplier: '',
      unit_of_measure: 'pcs',
      stock: 0,
      rop: 0,
      max_stock: 0,
      unit_price: 0,
      abc_class: 'A',
      criticality: 'Vital',
      warehouse: 'PHRC-WH-03',
    });
  };

  const handleAddItem = async () => {
    // Issue #2 — required field validation
    if (!newItem.item_name.trim() || !newItem.sku.trim() || !newItem.supplier.trim()) {
      alert('Please fill all required fields (Item Name, SKU, Supplier).');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Issue #3 — prevent duplicate SKUs
      const { data: existingItem } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('sku', newItem.sku.trim())
        .maybeSingle();

      if (existingItem) {
        alert('SKU already exists. Please use a unique SKU.');
        setSubmitting(false);
        return;
      }

      // Insert the new inventory item
      const { data: insertedItem, error } = await supabase
        .from('inventory_items')
        .insert([
          {
            ...newItem,
            sku: newItem.sku.trim(),
            item_name: newItem.item_name.trim(),
            supplier: newItem.supplier.trim(),
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Issue #6 — log the opening stock as a transaction for audit trail
      if (insertedItem) {
        const { error: txnError } = await supabase.from('transactions').insert([
          {
            reference: crypto.randomUUID(),
            transaction_type: 'Opening Stock',
            item_id: insertedItem.id,
            quantity: newItem.stock,
            warehouse: newItem.warehouse,
            created_by: user?.id,
          },
        ]);

        if (txnError) {
          // Don't block the user if only the transaction log fails —
          // the item itself was saved successfully.
          console.error('Failed to log opening stock transaction:', txnError);
        }
      }

      alert('Item added successfully');

      setShowAddModal(false);
      resetNewItem();
      fetchInventory();
    } catch (error) {
      console.error(error);
      alert('Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Stock — PHRC-WH-03</h1>
            <p className="text-gray-600 mt-1">{inventoryData.length} items at Port Harcourt Refinery — Warehouse 3</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all active:scale-95 shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-5 h-5" /> Add item
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by item, SKU, or supplier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-3xl border border-gray-200 bg-white text-lg focus:outline-none focus:border-emerald-500 shadow-sm transition"
            />
          </div>

          <select
            className="w-full md:w-auto bg-white border border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:border-emerald-500 text-base sm:text-lg min-w-40 shadow-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">Category: All</option>
            <option value="MRO Spares">MRO Spares</option>
            <option value="PPE">PPE</option>
            <option value="Tools">Tools</option>
          </select>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-3xl overflow-x-auto border border-gray-100 shadow-sm">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-6 font-medium text-gray-500 text-sm">SKU</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">ITEM</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">CATEGORY</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">ABC / VED</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">STOCK</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">ROP / MAX</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">UNIT PRICE</th>
                <th className="text-left p-6 font-medium text-gray-500 text-sm">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition-all duration-200 group">
                  <td className="p-6 font-mono text-sm text-gray-700">{item.sku}</td>
                  <td className="p-6">
                    <div className="font-semibold text-gray-900">{item.item_name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{item.supplier}</div>
                  </td>
                  <td className="p-6 text-gray-600">{item.category}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        ABC: {item.abc_class}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.criticality === 'Vital' ? 'bg-red-100 text-red-700' :
                        item.criticality === 'Essential' ? 'bg-amber-100 text-amber-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.criticality}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-semibold text-lg">{item.stock}</span>
                    <span className="text-xs text-gray-400 ml-1">{item.unit_of_measure}</span>
                  </td>
                  <td className="p-6 text-sm text-gray-600">
                    {item.rop} / {item.max_stock}
                  </td>
                  <td className="p-6 font-medium text-gray-900">
                    ₦{Number(item.unit_price).toLocaleString()}
                  </td>
                  <td className="p-6">
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-medium ${
                      item.stock <= item.rop
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.stock <= item.rop ? 'Low stock' : 'In stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          REWB CORE - NNPC Ltd
        </div>

      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-start gap-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Add Inventory Item</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ITEM NAME *</label>
                <input
                  type="text"
                  placeholder='e.g. 6" Gate Valve'
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.item_name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, item_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">SKU *</label>
                <input
                  type="text"
                  placeholder="OG-VALVE-..."
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.sku}
                  onChange={(e) =>
                    setNewItem({ ...newItem, sku: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">CATEGORY</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                >
                  <option>MRO Spares</option>
                  <option>PPE</option>
                  <option>Tools</option>
                  <option>Electrical</option>
                  <option>Instrumentation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">SUPPLIER *</label>
                <input
                  type="text"
                  placeholder="Vendor name"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.supplier}
                  onChange={(e) =>
                    setNewItem({ ...newItem, supplier: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">UNIT OF MEASURE</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.unit_of_measure}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit_of_measure: e.target.value })
                  }
                >
                  <option>pcs</option>
                  <option>kg</option>
                  <option>litres</option>
                  <option>meters</option>
                  <option>sets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">OPENING STOCK</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.stock}
                  onChange={(e) =>
                    setNewItem({ ...newItem, stock: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">UNIT PRICE (NGN)</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.unit_price}
                  onChange={(e) =>
                    setNewItem({ ...newItem, unit_price: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">REORDER POINT (ROP)</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.rop}
                  onChange={(e) =>
                    setNewItem({ ...newItem, rop: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">MAX STOCK</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.max_stock}
                  onChange={(e) =>
                    setNewItem({ ...newItem, max_stock: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ABC CLASS</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.abc_class}
                  onChange={(e) =>
                    setNewItem({ ...newItem, abc_class: e.target.value })
                  }
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">CRITICALITY (VED)</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.criticality}
                  onChange={(e) =>
                    setNewItem({ ...newItem, criticality: e.target.value })
                  }
                >
                  <option>Vital</option>
                  <option>Essential</option>
                  <option>Desirable</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">WAREHOUSE</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newItem.warehouse}
                  onChange={(e) =>
                    setNewItem({ ...newItem, warehouse: e.target.value })
                  }
                >
                  <option value="PHRC-WH-03">PHRC-WH-03 — Port Harcourt Refinery</option>
                </select>
              </div>

            </div>

            <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewItem();
                }}
                disabled={submitting}
                className="px-8 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={submitting}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Item'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
