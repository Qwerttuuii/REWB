import { useEffect, useState } from "react";
import Papa from "papaparse";
import { Download } from "lucide-react";
import { supabase } from "../../lib/supabase";
import TransactionModal from "./TransactionModal";

interface Transaction {
  id: string;
  reference: string;
  transaction_type: string;
  quantity: number;
  warehouse: string;
  notes: string;
  created_at: string;
  item_id?: string;
  created_by?: string;
  inventory_items: { item_name: string; sku: string } | null;
  profiles: { full_name: string; role: string } | null;
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
  const { data, error } = await supabase
  .from("transactions")
  .select(`
    *,
    inventory_items:item_id (
      item_name,
      sku
    ),
    profiles!transactions_created_by_profiles_fkey (
      full_name,
      role
    )
  `)
  .order("created_at", { ascending: false });

    if (error) {
      console.error(error);

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (fallbackError) {
        console.error(fallbackError);
      } else {
        setTransactions(
          (fallbackData || []).map((transaction) => ({
            ...transaction,
            inventory_items: null,
            profiles: null,
          })) as Transaction[]
        );
      }
    }

    if (!error && data) setTransactions(data as Transaction[]);
    setLoading(false);
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.reference?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.inventory_items?.item_name?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      typeFilter === "all" || transaction.transaction_type === typeFilter;

    const matchesWarehouse =
      warehouseFilter === "all" || transaction.warehouse === warehouseFilter;

    const transactionDate = new Date(transaction.created_at);

    const matchesFrom = !fromDate || transactionDate >= new Date(fromDate);
    const matchesTo = !toDate || transactionDate <= new Date(toDate + "T23:59:59");

    return matchesSearch && matchesType && matchesWarehouse && matchesFrom && matchesTo;
  });

  const exportCSV = () => {
    const rows = filteredTransactions.map((transaction) => ({
      Reference: transaction.reference,
      Type: transaction.transaction_type,
      Item: transaction.inventory_items?.item_name,
      SKU: transaction.inventory_items?.sku,
      Quantity: transaction.quantity,
      Warehouse: transaction.warehouse,
      Notes: transaction.notes,
      Recorded_By: transaction.profiles?.full_name,
      Role: transaction.profiles?.role,
      Date: new Date(transaction.created_at).toLocaleString(),
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toISOString().split("T")[0];
    link.download = `REWB_Transactions_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const badge = (type: string) => {
    const styles: Record<string, string> = {
      Receipt:    "bg-emerald-100 text-emerald-700",
      Issue:      "bg-red-100 text-red-700",
      Transfer:   "bg-blue-100 text-blue-700",
      Adjustment: "bg-amber-100 text-amber-700",
      Return:     "bg-purple-100 text-purple-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type] || "bg-gray-100 text-gray-700"}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">All inventory movements across warehouses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportCSV}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold transition shadow-lg shadow-emerald-600/20"
          >
            + Record Transaction
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm">
        <div className="grid lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search reference or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            <option value="all">All Types</option>
            <option value="Receipt">Receipt</option>
            <option value="Issue">Issue</option>
            <option value="Transfer">Transfer</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Return">Return</option>
          </select>

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          >
            <option value="all">All Warehouses</option>
            {[...new Set(transactions.map((t) => t.warehouse))].map((warehouse) => (
              <option key={warehouse} value={warehouse}>
                {warehouse}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-2xl px-4 py-3"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-5 text-sm font-medium text-gray-500">REFERENCE</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">TYPE</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">ITEM</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">QTY</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">WAREHOUSE</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">RECORDED BY</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">NOTES</th>
              <th className="text-left p-5 text-sm font-medium text-gray-500">DATE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-400">Loading transactions...</td></tr>
            ) : filteredTransactions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-400">No transactions found.</td></tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => {
                    setSelectedTransaction(t);
                    setShowDetails(true);
                  }}
                  className="cursor-pointer border-t hover:bg-gray-50 transition"
                >
                  <td className="p-5 font-mono text-sm text-gray-700">{t.reference}</td>
                  <td className="p-5">{badge(t.transaction_type)}</td>
                  <td className="p-5">
                    <div className="font-semibold text-gray-900">{t.inventory_items?.item_name || "—"}</div>
                    <div className="text-xs text-gray-500 font-mono">{t.inventory_items?.sku || "—"}</div>
                  </td>
                  <td className="p-5 font-semibold text-gray-900">{t.quantity}</td>
                  <td className="p-5 text-gray-600">{t.warehouse || "—"}</td>
                  <td className="p-5">
                    <div className="font-medium text-gray-900">{t.profiles?.full_name || "—"}</div>
                    <span
                      className={`mt-1 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.profiles?.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {t.profiles?.role || "Unknown"}
                    </span>
                  </td>
                  <td className="p-5 text-gray-600 max-w-[180px] truncate">{t.notes || "—"}</td>
                  <td className="p-5 text-gray-600">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        REWB CORE · NNPC Ltd · Administration Portal
      </div>

      <TransactionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          fetchTransactions();
          setShowModal(false);
        }}
      />

      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-5 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold">Transaction Details</h2>
                <p className="text-gray-500">{selectedTransaction.reference}</p>
              </div>
              <button onClick={() => setShowDetails(false)} className="text-2xl">
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Transaction Type</p>
                <p className="font-semibold text-lg capitalize">{selectedTransaction.transaction_type}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Item</p>
                <p className="font-semibold">{selectedTransaction.inventory_items?.item_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">SKU</p>
                <p>{selectedTransaction.inventory_items?.sku}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-bold text-2xl">{selectedTransaction.quantity}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Warehouse</p>
                <p>{selectedTransaction.warehouse}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Recorded By</p>
                <p className="font-semibold">{selectedTransaction.profiles?.full_name}</p>
                <p className="text-sm text-gray-500">{selectedTransaction.profiles?.role}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p>{selectedTransaction.notes || "No notes"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl">
                Print
              </button>
              <button onClick={() => setShowDetails(false)} className="flex-1 border py-4 rounded-2xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
