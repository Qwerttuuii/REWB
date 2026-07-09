import { useEffect, useState } from "react";
import { Download, Upload, Flag } from "lucide-react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import KPISection from "../components/dashboard/KPISection";
import { supabase } from "../lib/supabase";

export default function Dashboard() {

  const [stats, setStats] = useState({
    totalItems: 0,
    inventoryValue: 0,
    lowStock: 0,
    outOfStock: 0,
    warehouses: 0,
  });

  const [attentionItems, setAttentionItems] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showStockIn, setShowStockIn] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [showFlagLowStock, setShowFlagLowStock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    item: '',
    quantity: 1,
    note: '',
  });

  const resetForm = () => {
    setFormData({ item: '', quantity: 1, note: '' });
  };

  useEffect(() => {
    loadDashboard();
    loadItems();
  }, []);

  const loadItems = async () => {
    const { data } = await supabase
      .from("inventory_items")
      .select("*")
      .order("item_name");

    setItems(data || []);
  };

  const loadDashboard = async () => {
    try {
      const { data: inventory } = await supabase
        .from("inventory_items")
        .select("*");

      const { data: transactions } = await supabase
        .from("transactions")
        .select(`
          *,
          inventory_items (
            item_name,
            sku
          )
        `)
        .order("created_at", { ascending: false })
        .limit(6);

      const { count: warehouses } = await supabase
        .from("warehouses")
        .select("*", { count: "exact", head: true });

      if (!inventory) return;

      const totalItems = inventory.length;

      const inventoryValue = inventory.reduce(
        (sum, item) => sum + item.stock * Number(item.unit_price),
        0
      );

      const lowStock = inventory.filter(
        (item) => item.stock <= item.rop && item.stock > 0
      ).length;

      const outOfStock = inventory.filter(
        (item) => item.stock === 0
      ).length;

      setStats({
        totalItems,
        inventoryValue,
        lowStock,
        outOfStock,
        warehouses: warehouses || 0,
      });

      setAttentionItems(
        inventory
          .filter((item) => item.stock <= item.rop)
          .slice(0, 5)
      );

      setRecentTransactions(transactions || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (
    type: string,
    quantity: number,
    note: string
  ) => {
    if (!formData.item) {
      alert("Please select an item.");
      return;
    }

    if (quantity <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    const selectedItem = items.find((item) => item.id === formData.item);

    if (!selectedItem) {
      alert("Item not found.");
      return;
    }

    // Prevent issuing more than available stock
    if (type === "Issue" && quantity > selectedItem.stock) {
      alert(
        `Cannot issue ${quantity} — only ${selectedItem.stock} ${selectedItem.unit_of_measure || "units"} in stock.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let newStock = selectedItem.stock;

      if (type === "Receipt") newStock += quantity;
      if (type === "Issue") newStock -= quantity;

      await supabase
        .from("inventory_items")
        .update({ stock: newStock })
        .eq("id", selectedItem.id);

      await supabase.from("transactions").insert({
        reference: "TRX-" + Date.now(),
        transaction_type: type,
        item_id: selectedItem.id,
        quantity,
        warehouse: selectedItem.warehouse,
        notes: note,
        created_by: user?.id,
      });

      loadDashboard();
      loadItems();

      resetForm();
      setShowStockIn(false);
      setShowStockOut(false);

      alert("Transaction saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlagLowStock = async () => {
    if (!formData.item) {
      alert("Please select an item.");
      return;
    }

    const selectedItem = items.find((item) => item.id === formData.item);

    if (!selectedItem) {
      alert("Item not found.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("purchase_requests").insert({
        request_no: "PR-" + Date.now(),
        item_id: selectedItem.id,
        requested_by: user?.id,
        quantity: formData.quantity,
        supplier: selectedItem.supplier,
        warehouse: selectedItem.warehouse,
        priority: selectedItem.stock === 0 ? "Critical" : "High",
        notes: formData.note,
        status: "Pending",
      });

      resetForm();
      setShowFlagLowStock(false);

      alert("Reorder request created.");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Escapes a value for safe placement inside a CSV cell
  const escapeCSV = (value: any) => {
    const str = value === null || value === undefined ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportReport = () => {
    const rows: string[] = [];

    // --- Summary section ---
    rows.push('OPERATIONS DASHBOARD REPORT');
    rows.push(`Generated,${new Date().toLocaleString()}`);
    rows.push('');
    rows.push('SUMMARY');
    rows.push('Metric,Value');
    rows.push(`Total Items,${stats.totalItems}`);
    rows.push(`Inventory Value,${stats.inventoryValue}`);
    rows.push(`Low Stock Items,${stats.lowStock}`);
    rows.push(`Out of Stock Items,${stats.outOfStock}`);
    rows.push(`Warehouses,${stats.warehouses}`);
    rows.push('');

    // --- Full inventory section ---
    rows.push('INVENTORY ITEMS');
    rows.push('SKU,Item Name,Warehouse,Stock,Reorder Point,Unit Price,Unit of Measure,Supplier');
    items.forEach((item) => {
      rows.push([
        escapeCSV(item.sku),
        escapeCSV(item.item_name),
        escapeCSV(item.warehouse),
        escapeCSV(item.stock),
        escapeCSV(item.rop),
        escapeCSV(item.unit_price),
        escapeCSV(item.unit_of_measure),
        escapeCSV(item.supplier),
      ].join(','));
    });
    rows.push('');

    // --- Recent transactions section ---
    rows.push('RECENT TRANSACTIONS');
    rows.push('Reference,Type,Item,SKU,Quantity,Warehouse,Date');
    recentTransactions.forEach((t) => {
      rows.push([
        escapeCSV(t.reference),
        escapeCSV(t.transaction_type),
        escapeCSV(t.inventory_items?.item_name),
        escapeCSV(t.inventory_items?.sku),
        escapeCSV(t.quantity),
        escapeCSV(t.warehouse),
        escapeCSV(new Date(t.created_at).toLocaleString()),
      ].join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `operations-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8">

      <DashboardHeader onExportReport={handleExportReport} />

      <KPISection
        totalItems={stats.totalItems}
        inventoryValue={stats.inventoryValue}
        lowStock={stats.lowStock}
        outOfStock={stats.outOfStock}
        warehouses={stats.warehouses}
      />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div
          onClick={() => setShowStockIn(true)}
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-xl cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-200">
            <Download className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Record stock-in</h3>
          <p className="text-gray-600">Log a receipt from supplier or transfer</p>
        </div>

        <div
          onClick={() => setShowStockOut(true)}
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-rose-200 hover:shadow-xl cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-rose-200">
            <Upload className="w-7 h-7 text-rose-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Record stock-out</h3>
          <p className="text-gray-600">Issue items to a crew or work order</p>
        </div>

        <div
          onClick={() => setShowFlagLowStock(true)}
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-amber-200 hover:shadow-xl cursor-pointer transition-all group"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-amber-200">
            <Flag className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Flag low stock</h3>
          <p className="text-gray-600">Raise a reorder request for this site</p>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Items needing attention */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Items needing attention</h3>
            <a href="/dashboard/alerts" className="text-emerald-600 hover:underline cursor-pointer text-sm">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {attentionItems.length === 0 ? (
              <p className="text-sm text-gray-500">All items are within stock levels.</p>
            ) : (
              attentionItems.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-gray-500">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.stock === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.stock === 0 ? "Out of stock" : "Low stock"}
                    </span>
                    <p className="text-sm mt-1">
                      {item.stock}/{item.rop} {item.unit_of_measure}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Recent transactions</h3>
            <a href="/dashboard/transactions" className="text-emerald-600 hover:underline cursor-pointer text-sm">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions recorded yet.</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-gray-50">
                  <div>
                    <p className="font-semibold">
                      {transaction.inventory_items?.item_name || "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.transaction_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{transaction.quantity}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ==================== MODALS ==================== */}

      {/* Stock-In Modal */}
      {showStockIn && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Record stock-in</h2>
            <p className="text-gray-500 mb-6">Warehouse: PHRC-WH-03</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">ITEM</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.item_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">QUANTITY</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">NOTE</label>
                <textarea
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  rows={3}
                  placeholder="Optional reference / reason"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setShowStockIn(false); resetForm(); }}
                disabled={submitting}
                className="flex-1 py-4 border rounded-2xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createTransaction("Receipt", formData.quantity, formData.note)}
                disabled={submitting}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock-Out Modal */}
      {showStockOut && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Record stock-out</h2>
            <p className="text-gray-500 mb-6">Warehouse: PHRC-WH-03</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">ITEM</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.item_name} ({item.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">QUANTITY</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">NOTE</label>
                <textarea
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  rows={3}
                  placeholder="Optional reference / reason"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setShowStockOut(false); resetForm(); }}
                disabled={submitting}
                className="flex-1 py-4 border rounded-2xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createTransaction("Issue", formData.quantity, formData.note)}
                disabled={submitting}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Low Stock Modal */}
      {showFlagLowStock && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Flag low stock</h2>
            <p className="text-gray-500 mb-6">Warehouse: PHRC-WH-03</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">ITEM</label>
                <select
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.item_name} ({item.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">REQUESTED QUANTITY</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">NOTE</label>
                <textarea
                  className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  rows={3}
                  placeholder="Reason for flagging / reorder request"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => { setShowFlagLowStock(false); resetForm(); }}
                disabled={submitting}
                className="flex-1 py-4 border rounded-2xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagLowStock}
                disabled={submitting}
                className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}