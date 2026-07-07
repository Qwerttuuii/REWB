import { useEffect, useState } from "react";
import { AlertTriangle, PackageX, ClipboardList, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Alerts() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [outOfStock, setOutOfStock] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [reorderNote, setReorderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const { data: inventory } = await supabase
      .from("inventory_items")
      .select("*");

    const { data: reorder } = await supabase
      .from("purchase_requests")
      .select(`
        *,
        inventory_items:item_id (
          item_name,
          sku
        )
      `)
      .order("created_at", { ascending: false });

    if (inventory) {
      setLowStock(
        inventory.filter((item) => item.stock <= item.rop && item.stock > 0)
      );
      setOutOfStock(inventory.filter((item) => item.stock === 0));
    }

    setRequests(reorder || []);
    setLoading(false);
  };

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  const handleFlagReorder = async () => {
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const suggestedQty = selectedItem.max_stock - selectedItem.stock;

      await supabase.from("purchase_requests").insert({
        request_no: "PR-" + Date.now(),
        item_id: selectedItem.id,
        requested_by: user?.id,
        quantity: suggestedQty > 0 ? suggestedQty : 1,
        supplier: selectedItem.supplier,
        warehouse: selectedItem.warehouse,
        priority: selectedItem.stock === 0 ? "Critical" : "High",
        notes: reorderNote,
        status: "Pending",
      });

      alert("Reorder request submitted.");
      setSelectedItem(null);
      setReorderNote("");
      loadAlerts();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <p className="text-gray-500">Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Stock Alerts</h1>
          <p className="text-gray-600 mt-1">
            Live inventory status at PHRC-WH-03
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Low Stock</p>
                <p className="text-4xl font-bold text-amber-600 mt-3">{lowStock.length}</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Out of Stock</p>
                <p className="text-4xl font-bold text-red-600 mt-3">{outOfStock.length}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                <PackageX className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Pending Requests</p>
                <p className="text-4xl font-bold text-blue-600 mt-3">{pendingCount}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Section */}
        {lowStock.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Low Stock</h2>
              <span className="ml-auto text-sm text-gray-500">{lowStock.length} items</span>
            </div>
            <div className="divide-y divide-gray-50">
              {lowStock.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-5 hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{item.item_name}</p>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">{item.sku}</p>
                    <p className="text-xs text-gray-400 mt-1">Warehouse: {item.warehouse}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Stock / ROP</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {item.stock} / {item.rop} {item.unit_of_measure}
                      </p>
                    </div>
                    <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Low Stock
                    </span>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                    >
                      Flag for reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Out of Stock Section */}
        {outOfStock.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <PackageX className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Out of Stock</h2>
              <span className="ml-auto text-sm text-gray-500">{outOfStock.length} items</span>
            </div>
            <div className="divide-y divide-gray-50">
              {outOfStock.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-5 hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">{item.item_name}</p>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">{item.sku}</p>
                    <p className="text-xs text-gray-400 mt-1">Warehouse: {item.warehouse}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">In Stock</p>
                      <p className="font-semibold text-red-600 mt-0.5">
                        0 {item.unit_of_measure}
                      </p>
                    </div>
                    <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Out of Stock
                    </span>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                    >
                      Flag for reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All clear message */}
        {lowStock.length === 0 && outOfStock.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center mb-6">
            <p className="text-gray-500">All inventory items are within acceptable stock levels.</p>
          </div>
        )}

        {/* Pending Reorder Requests */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Reorder Requests</h2>
            <span className="ml-auto text-sm text-gray-500">{requests.length} total</span>
          </div>

          {requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No reorder requests yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map((req) => (
                <div key={req.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-5 hover:bg-gray-50 transition">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {req.inventory_items?.item_name || "—"}
                    </p>
                    <p className="text-sm text-gray-500 font-mono mt-0.5">
                      {req.inventory_items?.sku || "—"}
                    </p>
                    {req.notes && (
                      <p className="text-xs text-gray-400 mt-1">{req.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Requested Qty</p>
                      <p className="font-semibold text-gray-900 mt-0.5">{req.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                      req.status === "Pending"
                        ? "bg-blue-100 text-blue-700"
                        : req.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-sm text-gray-500">
          Need to add inventory? Head to{" "}
          <Link to="/dashboard/stock" className="text-emerald-600 hover:underline">
            Stock
          </Link>
          .
        </div>

      </div>

      {/* Flag for Reorder Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Flag for Reorder</h2>
              <button
                onClick={() => { setSelectedItem(null); setReorderNote(""); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Item</p>
                <p className="font-semibold text-gray-900">{selectedItem.item_name}</p>
                <p className="text-sm text-gray-500 font-mono">{selectedItem.sku}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current stock</p>
                  <p className="font-medium text-gray-900">
                    {selectedItem.stock} {selectedItem.unit_of_measure}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reorder point</p>
                  <p className="font-medium text-gray-900">{selectedItem.rop}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p className="font-medium text-gray-900">{selectedItem.warehouse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Suggested order</p>
                  <p className="font-medium text-gray-900">
                    {Math.max(selectedItem.max_stock - selectedItem.stock, 1)} {selectedItem.unit_of_measure}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">NOTE</label>
                <textarea
                  placeholder="Optional note for procurement..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500 resize-none"
                  value={reorderNote}
                  onChange={(e) => setReorderNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                onClick={() => { setSelectedItem(null); setReorderNote(""); }}
                disabled={submitting}
                className="px-6 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagReorder}
                disabled={submitting}
                className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm Flag"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
