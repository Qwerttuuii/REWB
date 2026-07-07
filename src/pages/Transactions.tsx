import { useState, useEffect } from "react";
import { Plus, ArrowDown, ArrowUp, ArrowLeftRight, RotateCcw } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Transactions() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    transaction_type: "Receipt",
    item_id: "",
    quantity: 1,
    warehouse: "PHRC-WH-03",
    notes: "",
  });

  useEffect(() => {
    fetchTransactions();
    fetchInventoryItems();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          inventory_items (
            item_name,
            sku
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("item_name");

    if (!error) {
      setInventoryItems(data || []);
    }
  };

  const resetNewTransaction = () => {
    setNewTransaction({
      transaction_type: "Receipt",
      item_id: "",
      quantity: 1,
      warehouse: "PHRC-WH-03",
      notes: "",
    });
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.item_id) {
      alert("Select an item");
      return;
    }

    if (newTransaction.quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const selectedItem = inventoryItems.find(
        (item) => item.id === newTransaction.item_id
      );

      if (!selectedItem) {
        alert("Select an item");
        setSubmitting(false);
        return;
      }

      // Prevent issuing/transferring more than is currently in stock
      const isOutgoing =
        newTransaction.transaction_type === "Issue" ||
        newTransaction.transaction_type === "Transfer";

      if (isOutgoing && newTransaction.quantity > selectedItem.stock) {
        alert(
          `Cannot ${newTransaction.transaction_type.toLowerCase()} ${newTransaction.quantity} ${selectedItem.unit_of_measure || "units"} — only ${selectedItem.stock} in stock.`
        );
        setSubmitting(false);
        return;
      }

      const reference =
        newTransaction.transaction_type.substring(0, 3).toUpperCase() +
        "-" +
        Date.now();

      const { error } = await supabase.from("transactions").insert([
        {
          reference,
          transaction_type: newTransaction.transaction_type,
          item_id: newTransaction.item_id,
          quantity: newTransaction.quantity,
          warehouse: newTransaction.warehouse,
          notes: newTransaction.notes,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      let updatedStock = selectedItem.stock;

      if (
        newTransaction.transaction_type === "Receipt" ||
        newTransaction.transaction_type === "Return"
      ) {
        updatedStock += newTransaction.quantity;
      }

      if (
        newTransaction.transaction_type === "Issue" ||
        newTransaction.transaction_type === "Transfer"
      ) {
        updatedStock -= newTransaction.quantity;
      }

      await supabase
        .from("inventory_items")
        .update({
          stock: updatedStock,
        })
        .eq("id", selectedItem.id);

      alert("Transaction recorded");

      setShowModal(false);
      resetNewTransaction();

      fetchTransactions();
      fetchInventoryItems();
    } catch (error) {
      console.error(error);
      alert("Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions =
    activeFilter === "All"
      ? transactions
      : transactions.filter((t) => t.transaction_type === activeFilter);

  const getBadge = (type: string) => {
    switch (type) {
      case "Receipt":
        return "bg-emerald-100 text-emerald-700";
      case "Issue":
        return "bg-red-100 text-red-700";
      case "Transfer":
        return "bg-blue-100 text-blue-700";
      case "Adjustment":
        return "bg-amber-100 text-amber-700";
      case "Return":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Receipt":
        return <ArrowDown className="w-4 h-4" />;
      case "Issue":
        return <ArrowUp className="w-4 h-4" />;
      case "Transfer":
        return <ArrowLeftRight className="w-4 h-4" />;
      case "Return":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Transactions
            </h1>
            <p className="text-gray-600 mt-1">
              Activity at PHRC-WH-03
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-5 h-5" />
            Record Transaction
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            "All",
            "Receipt",
            "Issue",
            "Transfer",
            "Adjustment",
            "Return",
          ].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full border transition ${
                activeFilter === filter
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl overflow-x-auto border border-gray-100 shadow-sm">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-5 text-sm text-gray-500">REF</th>
                <th className="text-left p-5 text-sm text-gray-500">TYPE</th>
                <th className="text-left p-5 text-sm text-gray-500">ITEM</th>
                <th className="text-left p-5 text-sm text-gray-500">QTY</th>
                <th className="text-left p-5 text-sm text-gray-500">WAREHOUSE</th>
                <th className="text-left p-5 text-sm text-gray-500">NOTE</th>
                <th className="text-left p-5 text-sm text-gray-500">DATE</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-5 font-mono text-sm">
                    {transaction.reference}
                  </td>

                  <td className="p-5">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getBadge(
                        transaction.transaction_type
                      )}`}
                    >
                      {getIcon(transaction.transaction_type)}
                      {transaction.transaction_type}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="font-medium text-gray-900">
                      {transaction.inventory_items?.item_name || "—"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.inventory_items?.sku || "—"}
                    </div>
                  </td>

                  <td className="p-5 font-semibold">
                    {transaction.quantity}
                  </td>

                  <td className="p-5 text-gray-600">
                    {transaction.warehouse}
                  </td>

                  <td className="p-5 text-gray-600">
                    {transaction.notes || "—"}
                  </td>

                  <td className="p-5 text-gray-600">
                    {transaction.created_at
                      ? new Date(transaction.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          REWB CORE - NNPC Ltd
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-start gap-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Record Transaction
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  TYPE
                </label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={newTransaction.transaction_type}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      transaction_type: e.target.value,
                    })
                  }
                >
                  <option>Receipt</option>
                  <option>Issue</option>
                  <option>Transfer</option>
                  <option>Adjustment</option>
                  <option>Return</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  ITEM
                </label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={newTransaction.item_id}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      item_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select Item</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.item_name} ({item.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  QUANTITY
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={newTransaction.quantity}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  WAREHOUSE
                </label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={newTransaction.warehouse}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      warehouse: e.target.value,
                    })
                  }
                >
                  <option>PHRC-WH-03</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  NOTE
                </label>
                <input
                  type="text"
                  placeholder="Optional reference / reason"
                  className="w-full border border-gray-200 rounded-2xl p-4"
                  value={newTransaction.notes}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetNewTransaction();
                }}
                disabled={submitting}
                className="px-8 py-3 border border-gray-300 rounded-2xl disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveTransaction}
                disabled={submitting}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
