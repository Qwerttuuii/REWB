import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Warehouse,
  Activity,
  Boxes,
  MapPin,
  User,
  X,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface WarehouseItem {
  id: string;
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  status: string;
  capacity: number;
  description: string;
  manager_id: string;
  manager?: { full_name: string } | null;
  skuCount: number;
  inventoryValue: number;
}

const emptyWarehouse = {
  warehouse_code: "",
  warehouse_name: "",
  location: "",
  manager_id: "",
  capacity: 0,
  description: "",
  status: "Active",
};

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState(emptyWarehouse);
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalCapacity: 0,
  });

  useEffect(() => {
    loadWarehouses();
    loadManagers();
  }, []);

  const loadWarehouses = async () => {
    const { data: warehouseData } = await supabase
      .from("warehouses")
      .select(`*, manager:profiles(full_name)`)
      .order("warehouse_code");

    if (!warehouseData) return;

    const { data: inventory } = await supabase
      .from("inventory_items")
      .select("warehouse, stock, unit_price");

    const enriched = warehouseData.map((wh) => {
      const items = (inventory || []).filter(
        (i) => i.warehouse === wh.warehouse_code
      );
      return {
        ...wh,
        skuCount: items.length,
        inventoryValue: items.reduce(
          (sum, i) => sum + (i.stock || 0) * Number(i.unit_price || 0),
          0
        ),
      };
    });

    setWarehouses(enriched);
    setStats({
      total: enriched.length,
      active: enriched.filter((w) => w.status === "Active").length,
      inactive: enriched.filter((w) => w.status !== "Active").length,
      totalCapacity: enriched.reduce((sum, w) => sum + (w.capacity || 0), 0),
    });
  };

  const loadManagers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "stores_manager")
      .order("full_name");
    setManagers(data || []);
  };

  const createWarehouse = async () => {
    if (!newWarehouse.warehouse_code.trim() || !newWarehouse.warehouse_name.trim()) {
      alert("Warehouse code and name are required.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("warehouses").insert({
      ...newWarehouse,
      manager_id: newWarehouse.manager_id || null,
    });
    if (error) { alert(error.message); setSubmitting(false); return; }
    setShowModal(false);
    setNewWarehouse(emptyWarehouse);
    loadWarehouses();
    setSubmitting(false);
  };

  const filtered = useMemo(() => {
    return warehouses.filter((w) => {
      const matchSearch =
        w.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.warehouse_code?.toLowerCase().includes(search.toLowerCase()) ||
        w.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || w.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [warehouses, search, statusFilter]);

  const totalInventoryValue = warehouses.reduce((sum, w) => sum + w.inventoryValue, 0);

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Warehouses</h1>
            <p className="text-gray-500 mt-1">Monitor every site across your organization.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 transition px-6 py-3 rounded-2xl text-white flex items-center gap-2 font-semibold shadow-lg shadow-emerald-600/20"
          >
            <Plus size={20} /> Add Warehouse
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Warehouses</p>
                <h2 className="text-3xl sm:text-4xl font-bold mt-4">{stats.total}</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
                <h2 className="text-3xl sm:text-4xl font-bold mt-4">{stats.active}</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Capacity</p>
                <h2 className="text-3xl sm:text-4xl font-bold mt-4">{stats.totalCapacity.toLocaleString()}</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Boxes className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
                <h2 className="text-2xl font-bold mt-4">₦{totalInventoryValue.toLocaleString()}</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input
                placeholder="Search by name, code or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-5 py-3 rounded-2xl border border-gray-200 focus:border-emerald-500 focus:outline-none min-w-40"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Warehouse Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400">
            No warehouses found.
          </div>
        ) : (
          <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6">
            {filtered.map((warehouse) => {
              const usagePercent = warehouse.capacity
                ? Math.min((warehouse.skuCount / warehouse.capacity) * 100, 100)
                : 0;

              return (
                <div
                  key={warehouse.id}
                  className="bg-white rounded-3xl border border-gray-100 p-7 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 transition">
                        <Warehouse size={26} className="text-emerald-700 group-hover:text-white transition" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                          {warehouse.warehouse_code}
                        </p>
                        <h2 className="text-xl font-bold text-gray-900 mt-0.5 leading-tight">
                          {warehouse.warehouse_name}
                        </h2>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                      warehouse.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {warehouse.status}
                    </span>
                  </div>

                  {/* Location & Manager */}
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      {warehouse.location || "—"}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      {warehouse.manager?.full_name || "No Manager Assigned"}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Inv. Value</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ₦{warehouse.inventoryValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">SKUs</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{warehouse.skuCount}</p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Capacity Usage</span>
                      <span>{warehouse.skuCount} / {warehouse.capacity || 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
                    <button
                      onClick={() => { setSelectedWarehouse(warehouse); setDrawerOpen(true); }}
                      className="flex items-center gap-1.5 text-emerald-600 font-semibold hover:text-emerald-700 text-sm transition"
                    >
                      View Details <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400">
                      {warehouse.capacity ? `${usagePercent.toFixed(0)}% used` : "No capacity set"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          REWB CORE · NNPC Ltd · Administration Portal
        </div>

      </div>

      {/* Add Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4 p-5 sm:p-8 border-b border-gray-100">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Add Warehouse</h2>
                <p className="text-gray-500 mt-1">Create a new warehouse location.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 sm:p-8 grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WAREHOUSE CODE *</label>
                <input placeholder="e.g. PHRC-WH-03"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newWarehouse.warehouse_code}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, warehouse_code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WAREHOUSE NAME *</label>
                <input placeholder="e.g. Port Harcourt Refinery — WH 3"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newWarehouse.warehouse_name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, warehouse_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LOCATION</label>
                <input placeholder="e.g. Port Harcourt, Rivers"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newWarehouse.location}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MANAGER</label>
                <select className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newWarehouse.manager_id}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, manager_id: e.target.value })}>
                  <option value="">Select Manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CAPACITY</label>
                <input type="number"
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newWarehouse.capacity}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">STATUS</label>
                <select className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={newWarehouse.status}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, status: e.target.value })}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION</label>
                <textarea rows={3}
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500 resize-none"
                  value={newWarehouse.description}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, description: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-gray-100 p-6 flex justify-end gap-4">
              <button onClick={() => { setShowModal(false); setNewWarehouse(emptyWarehouse); }}
                disabled={submitting}
                className="px-8 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={createWarehouse} disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-semibold disabled:opacity-50">
                {submitting ? "Creating..." : "Create Warehouse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedWarehouse && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setDrawerOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 sm:p-8 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                    {selectedWarehouse.warehouse_code}
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">
                    {selectedWarehouse.warehouse_name}
                  </h2>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-8">

              {/* General Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">General Information</h3>
                <div className="space-y-3">
                  {[
                    { label: "Location", value: selectedWarehouse.location },
                    { label: "Status", value: selectedWarehouse.status },
                    { label: "Manager", value: selectedWarehouse.manager?.full_name || "Not Assigned" },
                    { label: "Capacity", value: selectedWarehouse.capacity?.toLocaleString() || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Inventory Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Inv. Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      ₦{selectedWarehouse.inventoryValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">SKUs</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{selectedWarehouse.skuCount}</p>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-semibold text-gray-900">Capacity Usage</span>
                  <span className="text-gray-500">{selectedWarehouse.skuCount} / {selectedWarehouse.capacity} units</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        (selectedWarehouse.skuCount / (selectedWarehouse.capacity || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedWarehouse.capacity
                    ? `${((selectedWarehouse.skuCount / selectedWarehouse.capacity) * 100).toFixed(0)}% of capacity used`
                    : "No capacity configured"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3 font-medium transition">
                  Edit Warehouse
                </button>
                <Link
                  to={`/admin/inventory?warehouse=${selectedWarehouse.warehouse_code}`}
                  className="bg-gray-900 hover:bg-black text-white rounded-2xl py-3 font-medium transition text-center block"
                >
                  View Inventory
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
