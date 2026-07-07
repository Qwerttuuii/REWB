import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  AlertTriangle,
  Search,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminAlerts() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    quantity: 1,
    supplier: "",
    priority: "Medium",
    notes: "",
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("stock");

    if (error) {
      console.error("Failed to load admin alerts:", error);
      setErrorMessage(error.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  const alerts = items.filter((item) => item.stock <= item.rop);

  const filtered = alerts.filter(
    (item) =>
      item.item_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.sku
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const critical = alerts.filter((i) => i.stock === 0).length;

  const low = alerts.filter(
    (i) => i.stock > 0 && i.stock <= i.rop
  ).length;

  const createPurchaseRequest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !selectedAlert) return;

    const { error } = await supabase.from("purchase_requests").insert({
      request_no: "PR-" + Date.now(),
      item_id: selectedAlert.id,
      quantity: requestData.quantity,
      supplier: requestData.supplier,
      warehouse: selectedAlert.warehouse,
      priority: requestData.priority,
      notes: requestData.notes,
      requested_by: user.id,
      status: "Pending",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Purchase request submitted.");
    setShowRequestModal(false);
    setShowDrawer(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">

        <div>

          <h1 className="text-3xl sm:text-4xl font-bold">
            Alerts
          </h1>

          <p className="text-gray-500">
            Monitor inventory issues across all warehouses
          </p>

        </div>

      </div>

      {/* Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">

        <div className="bg-white rounded-3xl p-6">

          <AlertTriangle className="text-red-500 mb-4"/>

          <p className="text-gray-500">
            Total Alerts
          </p>

          <h2 className="text-4xl font-bold">

            {alerts.length}

          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6">

          <XCircle className="text-red-600 mb-4"/>

          <p className="text-gray-500">

            Out of Stock

          </p>

          <h2 className="text-4xl font-bold">

            {critical}

          </h2>

        </div>

        <div className="bg-white rounded-3xl p-6">

          <AlertCircle className="text-yellow-500 mb-4"/>

          <p className="text-gray-500">

            Low Stock

          </p>

          <h2 className="text-4xl font-bold">

            {low}

          </h2>

        </div>

      </div>

      {/* Search */}

      <div className="bg-white rounded-3xl p-5 mb-8">

        <div className="relative max-w-md">

          <Search className="absolute left-4 top-4 text-gray-400"/>

          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search item..."
            className="w-full border rounded-2xl pl-12 py-3"
          />

        </div>

      </div>

      {/* Table */}

      <div className="bg-white rounded-3xl overflow-x-auto">

        <table className="w-full min-w-[760px]">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-5">Item</th>
              <th>SKU</th>
              <th>Warehouse</th>
              <th>Stock</th>
              <th>ROP</th>
              <th>Status</th>
              <th></th>
            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Loading alerts...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-red-600">
                  Could not load alerts: {errorMessage}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  {items.length === 0
                    ? "No inventory items found."
                    : "No low-stock alerts. All visible inventory items are above reorder point."}
                </td>
              </tr>
            ) : filtered.map((item)=>(

              <tr
                key={item.id}
                className="border-t hover:bg-gray-50"
              >

                <td className="p-5">

                  <div className="font-semibold">

                    {item.item_name}

                  </div>

                </td>

                <td>{item.sku}</td>

                <td>{item.warehouse}</td>

                <td>{item.stock}</td>

                <td>{item.rop}</td>

                <td>

                  {item.stock===0 ? (

                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">

                      Out of Stock

                    </span>

                  ) : (

                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">

                      Low Stock

                    </span>

                  )}

                </td>

                <td className="p-5 text-right">
                  <button
                    onClick={() => {
                      setSelectedAlert(item);
                      setShowDrawer(true);
                    }}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Alert Drawer */}
      {showDrawer && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] p-5 sm:p-8 shadow-2xl overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold">
                  {selectedAlert.item_name}
                </h2>
                <p className="text-gray-500">
                  {selectedAlert.sku} • {selectedAlert.warehouse}
                </p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="text-lg font-semibold">{selectedAlert.stock}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reorder Point</p>
                  <p className="text-lg font-semibold">{selectedAlert.rop}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="text-lg font-semibold">
                    {selectedAlert.supplier || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold">
                    {selectedAlert.stock === 0 ? "Out of Stock" : "Low Stock"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowDrawer(false)}
                className="flex-1 border rounded-2xl py-4"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setRequestData({
                    quantity: selectedAlert.rop,
                    supplier: selectedAlert.supplier,
                    priority: "High",
                    notes: "",
                  });
                  setShowRequestModal(true);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-4 font-semibold"
              >
                Create Purchase Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Request Modal */}
      {showRequestModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-8">
            <h2 className="text-3xl font-bold mb-2">
              Create Purchase Request
            </h2>

            <p className="text-gray-500 mb-8">
              {selectedAlert.item_name}
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">
                  Quantity
                </label>
                <input
                  type="number"
                  value={requestData.quantity}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      quantity: Number(e.target.value),
                    })
                  }
                  className="w-full mt-2 border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Supplier
                </label>
                <input
                  value={requestData.supplier}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      supplier: e.target.value,
                    })
                  }
                  className="w-full mt-2 border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Priority
                </label>
                <select
                  value={requestData.priority}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      priority: e.target.value,
                    })
                  }
                  className="w-full mt-2 border rounded-xl p-3"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={requestData.notes}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full mt-2 border rounded-xl p-3"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 border rounded-2xl py-4"
              >
                Cancel
              </button>

              <button
                onClick={createPurchaseRequest}
                className="flex-1 bg-emerald-600 text-white rounded-2xl py-4"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
