import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Inventory {
  id: string;
  sku: string;
  item_name: string;
  category: string;
  supplier: string;
  unit_of_measure?: string;
  warehouse: string;
  stock: number;
  rop: number;
  max_stock: number;
  unit_price: number;
  abc_class: string;
  criticality: string;
}

export default function AdminInventory() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();

  const [warehouseFilter, setWarehouseFilter] = useState(
    searchParams.get("warehouse") || "All"
  );
  const [newItem, setNewItem] = useState({
    sku: "",
    item_name: "",
    category: "MRO Spares",
    supplier: "",
    unit_of_measure: "pcs",
    warehouse: "PHRC-WH-03",
    stock: 0,
    rop: 0,
    max_stock: 0,
    unit_price: 0,
    abc_class: "A",
    criticality: "Vital",
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);

    const { data } = await supabase
      .from("inventory_items")
      .select("*")
      .order("created_at", { ascending: false });

    setItems(data || []);
    setLoading(false);
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier.toLowerCase().includes(search.toLowerCase());

      const matchesWarehouse =
        warehouseFilter === "All" ||
        item.warehouse === warehouseFilter;

      return matchesSearch && matchesWarehouse;
    });
  }, [items, search, warehouseFilter]);

  const totalValue = items.reduce(
    (sum, item) => sum + item.stock * Number(item.unit_price),
    0
  );

  const lowStock = items.filter(
    (i) => i.stock <= i.rop
  ).length;

  const outOfStock = items.filter(
    (i) => i.stock === 0
  ).length;

  const warehouses = [
    "All",
    ...new Set(items.map((i) => i.warehouse)),
  ];

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;

    await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id);

    fetchInventory();
  }

  const resetNewItem = () => {
    setNewItem({
      sku: "",
      item_name: "",
      category: "MRO Spares",
      supplier: "",
      unit_of_measure: "pcs",
      warehouse: "PHRC-WH-03",
      stock: 0,
      rop: 0,
      max_stock: 0,
      unit_price: 0,
      abc_class: "A",
      criticality: "Vital",
    });
  };

  async function handleAddItem() {
    if (!newItem.item_name.trim() || !newItem.sku.trim() || !newItem.supplier.trim()) {
      setFormError("Please fill in Item Name, SKU, and Supplier.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const { data: existingItem } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("sku", newItem.sku.trim())
        .maybeSingle();

      if (existingItem) {
        setFormError("SKU already exists. Please use a unique SKU.");
        setSubmitting(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("inventory_items").insert([
        {
          ...newItem,
          sku: newItem.sku.trim(),
          item_name: newItem.item_name.trim(),
          supplier: newItem.supplier.trim(),
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      setShowAddModal(false);
      resetNewItem();
      fetchInventory();
    } catch (error) {
      console.error(error);
      setFormError("Failed to add item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">

        <div>

          <h1 className="text-3xl sm:text-4xl font-bold">
            Inventory
          </h1>

          <p className="text-gray-500 mt-2">
            Manage all inventory across warehouses
          </p>

        </div>

        <button
          onClick={() => {
            setFormError("");
            resetNewItem();
            setShowAddModal(true);
          }}
          className="bg-emerald-600 text-white px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
        >

          <Plus size={18} />

          Add Item

        </button>

      </div>

      {/* KPI */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">

        <div className="bg-white rounded-3xl p-6">

          <p className="text-gray-500">
            Total Items
          </p>

          <h2 className="text-4xl font-bold mt-3">

            {items.length}

          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6">

          <p className="text-gray-500">

            Inventory Value

          </p>

          <h2 className="text-4xl font-bold mt-3">

            ₦{totalValue.toLocaleString()}

          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6">

          <p className="text-gray-500">

            Low Stock

          </p>

          <h2 className="text-4xl font-bold text-orange-600 mt-3">

            {lowStock}

          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6">

          <p className="text-gray-500">

            Out of Stock

          </p>

          <h2 className="text-4xl font-bold text-red-600 mt-3">

            {outOfStock}

          </h2>

        </div>

      </div>

      {/* SEARCH */}

      <div className="bg-white rounded-3xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row gap-4">

        <div className="flex-1 relative">

          <Search
            className="absolute left-4 top-3.5 text-gray-400"
            size={20}
          />

          <input
            placeholder="Search SKU, Item or Supplier..."
            className="w-full border rounded-xl pl-12 pr-4 py-3"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <select
          className="border rounded-xl px-4 py-3 sm:py-0"
          value={warehouseFilter}
          onChange={(e) =>
            setWarehouseFilter(e.target.value)
          }
        >

          {warehouses.map((w) => (

            <option key={w}>{w}</option>

          ))}

        </select>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-3xl overflow-x-auto">

        <table className="w-full min-w-[820px]">

          <thead className="bg-slate-100">

            <tr>

              <th className="p-4 text-left">SKU</th>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Stock</th>
              <th>ROP</th>
              <th>ABC</th>
              <th>Criticality</th>
              <th>Value</th>
              <th></th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan={9}
                  className="text-center py-10"
                >

                  Loading...

                </td>

              </tr>

            ) : filteredItems.map((item) => (

              <tr
                key={item.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="p-4 font-semibold">

                  {item.sku}

                </td>

                <td>

                  {item.item_name}

                </td>

                <td>

                  {item.warehouse}

                </td>

                <td>

                  {item.stock}

                </td>

                <td>

                  {item.rop}

                </td>

                <td>

                  {item.abc_class}

                </td>

                <td>

                  {item.criticality}

                </td>

                <td>

                  ₦{(
                    item.stock *
                    Number(item.unit_price)
                  ).toLocaleString()}

                </td>

                <td>

                  <div className="flex gap-2 justify-center">

                    <button>

                      <Pencil
                        className="text-blue-600"
                        size={18}
                      />

                    </button>

                    <button
                      onClick={() =>
                        deleteItem(item.id)
                      }
                    >

                      <Trash2
                        className="text-red-600"
                        size={18}
                      />

                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Add Inventory Item</h2>
                <p className="text-gray-500">Create a new stock item in the system.</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormError("");
                }}
                className="text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Item Name</label>
                <input
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="e.g. Hydraulic Pump"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">SKU</label>
                <input
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="e.g. HP-001"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <input
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Supplier</label>
                <input
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Warehouse</label>
                <input
                  value={newItem.warehouse}
                  onChange={(e) => setNewItem({ ...newItem, warehouse: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Stock</label>
                <input
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Reorder Point</label>
                <input
                  type="number"
                  value={newItem.rop}
                  onChange={(e) => setNewItem({ ...newItem, rop: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Max Stock</label>
                <input
                  type="number"
                  value={newItem.max_stock}
                  onChange={(e) => setNewItem({ ...newItem, max_stock: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Unit Price</label>
                <input
                  type="number"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">ABC Class</label>
                <input
                  value={newItem.abc_class}
                  onChange={(e) => setNewItem({ ...newItem, abc_class: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Criticality</label>
                <input
                  value={newItem.criticality}
                  onChange={(e) => setNewItem({ ...newItem, criticality: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormError("");
                }}
                className="rounded-2xl border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={submitting}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
