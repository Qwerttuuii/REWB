import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionModal({ open, onClose, onSuccess }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    transaction_type: "Receipt",
    item_id: "",
    quantity: 1,
    warehouse: "",
    destination_warehouse: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadItems();
      loadWarehouses();
    }
  }, [open]);

  async function loadItems() {
    const { data } = await supabase
      .from("inventory_items")
      .select(`
        id,
        item_name,
        sku,
        warehouse,
        stock,
        rop
      `)
      .order("item_name");
    setItems(data || []);
  }

  async function loadWarehouses() {
    const { data } = await supabase
      .from("warehouses")
      .select("warehouse_code, warehouse_name")
      .order("warehouse_name");

    setWarehouses(data || []);
  }

  async function saveTransaction() {
    if (!form.item_id) {
      alert("Please select an inventory item.");
      return;
    }

    if (form.quantity <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.rpc("process_transaction", {
        p_transaction_type: form.transaction_type,
        p_item_id: form.item_id,
        p_quantity: form.quantity,
        p_warehouse: form.warehouse,
        p_destination_warehouse: form.destination_warehouse || null,
        p_notes: form.notes,
        p_created_by: user.id,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Transaction saved successfully");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-start gap-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Record Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">TRANSACTION TYPE</label>
            <select className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
              value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
              <option>Receipt</option>
              <option>Issue</option>
              <option>Transfer</option>
              <option>Adjustment</option>
              <option>Return</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">INVENTORY ITEM</label>
            <select className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
              value={form.item_id}
              onChange={(e) => {
                const item = items.find((i) => i.id === e.target.value);
                setForm({
                  ...form,
                  item_id: e.target.value,
                  warehouse: item?.warehouse || "",
                });
              }}>
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.item_name} ({item.stock} in stock)
                </option>
              ))}
            </select>
          </div>

          {form.item_id && (() => {
            const item = items.find((i) => i.id === form.item_id);
            if (!item) return null;

            return (
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Current Stock</p>
                    <p className="font-bold text-xl">{item.stock}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reorder Point</p>
                    <p className="font-bold text-xl">{item.rop}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Warehouse</p>
                    <p className="font-bold">{item.warehouse}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QUANTITY</label>
            <input type="number" min={1} className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
              value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">WAREHOUSE</label>
            <select
              className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.warehouse_code} value={warehouse.warehouse_code}>
                  {warehouse.warehouse_name}
                </option>
              ))}
            </select>
          </div>

          {form.transaction_type === "Transfer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DESTINATION WAREHOUSE</label>
              <select
                className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                value={form.destination_warehouse}
                onChange={(e) => setForm({ ...form, destination_warehouse: e.target.value })}
              >
                <option value="">Select destination</option>
                {warehouses.filter((w) => w.warehouse_code !== form.warehouse).map((warehouse) => (
                  <option key={warehouse.warehouse_code} value={warehouse.warehouse_code}>
                    {warehouse.warehouse_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NOTES</label>
            <textarea rows={3} placeholder="Optional reference / reason"
              className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500 resize-none"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 mt-8 pt-6 border-t">
          <button onClick={onClose} disabled={submitting}
            className="px-8 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button
            onClick={saveTransaction}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl"
          >
            Save Transaction
          </button>
        </div>

      </div>
    </div>
  );
}
