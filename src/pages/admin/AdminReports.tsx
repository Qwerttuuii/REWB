import { useEffect, useState } from "react";
import {
  FileBarChart,
  DollarSign,
  Package,
  ArrowRightLeft,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "../../lib/supabase";

export default function AdminReports() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [transactionFilter, setTransactionFilter] = useState("All");
  const [selectedReport, setSelectedReport] = useState("transactions");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: inventoryData } = await supabase
      .from("inventory_items")
      .select("*");

    const { data: transactionData } = await supabase
      .from("transactions")
      .select("*");

    const { data: warehouseData } = await supabase
      .from("warehouses")
      .select("*")
      .order("warehouse_name");

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*");

    setInventory(inventoryData || []);
    setTransactions(transactionData || []);
    setWarehouses(warehouseData || []);
    setUsers(usersData || []);
  };

  const inventoryValue = inventory.reduce(
    (sum, item) => sum + item.stock * item.unit_price,
    0
  );

  const lowStock = inventory.filter(
    (item) => item.stock <= item.rop
  ).length;

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = transaction.created_at.split("T")[0];

    const matchesFrom = !fromDate || transactionDate >= fromDate;
    const matchesTo = !toDate || transactionDate <= toDate;
    const matchesWarehouse =
      warehouseFilter === "All" || transaction.warehouse === warehouseFilter;
    const matchesType =
      transactionFilter === "All" || transaction.transaction_type === transactionFilter;

    return matchesFrom && matchesTo && matchesWarehouse && matchesType;
  });

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transaction data available.");
      return;
    }

    const headers = [
      "Reference",
      "Transaction Type",
      "Warehouse",
      "Quantity",
      "Notes",
      "Date",
    ];

    const rows = filteredTransactions.map((transaction) => [
      transaction.reference,
      transaction.transaction_type,
      transaction.warehouse,
      transaction.quantity,
      transaction.notes || "",
      new Date(transaction.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `REWB_CORE_Transactions_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const reportCards = [
    {
      id: "inventory",
      title: "Inventory Report",
      description: "Current stock levels and valuation.",
    },
    {
      id: "transactions",
      title: "Transaction Report",
      description: "Stock movement history.",
    },
    {
      id: "warehouses",
      title: "Warehouse Report",
      description: "Warehouse performance overview.",
    },
    {
      id: "lowstock",
      title: "Low Stock Report",
      description: "Items below reorder level.",
    },
    {
      id: "users",
      title: "User Activity",
      description: "System users and activities.",
    },
  ];

  const warehouseChartData = warehouses.map((warehouse) => {
    const totalItems = inventory.filter(
      (item) => item.warehouse === warehouse.warehouse_name
    ).length;

    return {
      name: warehouse.warehouse_name,
      items: totalItems,
    };
  });

  // Fixed color per transaction type so colors never shift depending on
  // which types are present in the data.
  const TYPE_COLORS: Record<string, string> = {
    receipt: "#10B981",
    issue: "#EF4444",
    transfer: "#3B82F6",
    adjustment: "#F59E0B",
  };

  const transactionChartData = Object.values(
    transactions.reduce((acc: any, transaction: any) => {
      const type = transaction.transaction_type;

      if (!acc[type]) {
        acc[type] = {
          name: type,
          value: 0,
        };
      }

      acc[type].value++;

      return acc;
    }, {})
  ) as { name: string; value: number }[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Reports & Audit</h1>
          <p className="text-slate-500 mt-2">Generate inventory and operational reports.</p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-500">Inventory Value</p>
              <h2 className="text-3xl font-bold mt-2">₦{inventoryValue.toLocaleString()}</h2>
            </div>
            <DollarSign className="text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-500">Inventory Items</p>
              <h2 className="text-3xl font-bold mt-2">{inventory.length}</h2>
            </div>
            <Package className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-500">Transactions</p>
              <h2 className="text-3xl font-bold mt-2">{transactions.length}</h2>
            </div>
            <ArrowRightLeft className="text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-500">Low Stock</p>
              <h2 className="text-3xl font-bold mt-2">{lowStock}</h2>
            </div>
            <AlertTriangle className="text-red-600" />
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="bg-white rounded-3xl border p-5 sm:p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Report Categories</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {reportCards.map((report) => {

            const active = selectedReport === report.id;

            return (

                <div
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`cursor-pointer rounded-3xl border p-6 transition-all duration-300 hover:shadow-lg
                    ${
                        active
                            ? "border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]"
                            : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                >

                    <div className="flex justify-between items-start mb-5">

                        <FileBarChart
                            className={`w-9 h-9 ${
                                active
                                    ? "text-emerald-600"
                                    : "text-slate-500"
                            }`}
                        />

                        {active && (

                            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">

                                ✓

                            </div>

                        )}

                    </div>

                    <h3 className="font-bold text-xl mb-2">

                        {report.title}

                    </h3>

                    <p className="text-slate-500">

                        {report.description}

                    </p>

                </div>

            );

          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-3xl border p-5 sm:p-8 shadow-sm overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6">Inventory by Warehouse</h2>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={warehouseChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="items" fill="#3B82F6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl border p-5 sm:p-8 shadow-sm overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6">Transaction Breakdown</h2>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={transactionChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {transactionChartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={TYPE_COLORS[entry.name] || "#8B5CF6"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl border p-5 sm:p-8">
        <h2 className="text-2xl font-bold mb-6">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded-2xl p-4"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-2xl p-4"
          />

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="border rounded-2xl p-4"
          >
            <option value="All">All Warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.warehouse_name}>
                {warehouse.warehouse_name}
              </option>
            ))}
          </select>

          <select
            value={transactionFilter}
            onChange={(e) => setTransactionFilter(e.target.value)}
            className="border rounded-2xl p-4"
          >
            <option value="All">All Transactions</option>
            <option value="receipt">Receipt</option>
            <option value="issue">Issue</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
      </div>

      {selectedReport === "transactions" && (
        <div className="bg-white rounded-3xl border mt-8 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-8 py-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Recent Transactions</h2>
              <p className="text-slate-500 mt-1">Latest inventory movements across all warehouses.</p>
            </div>

            <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
              {filteredTransactions.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Warehouse</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t hover:bg-slate-50 transition">
                    <td className="px-6 py-5 font-medium">{transaction.reference}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.transaction_type === "receipt"
                            ? "bg-green-100 text-green-700"
                            : transaction.transaction_type === "issue"
                            ? "bg-red-100 text-red-700"
                            : transaction.transaction_type === "transfer"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">{transaction.warehouse}</td>
                    <td className="px-6 py-5">{transaction.quantity}</td>
                    <td className="px-6 py-5">{new Date(transaction.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === "inventory" && (

      <div className="bg-white rounded-3xl border mt-8 overflow-hidden">

      <table className="w-full">

      <thead className="bg-slate-50">

      <tr>

      <th className="px-6 py-4 text-left">SKU</th>

      <th className="px-6 py-4 text-left">Item</th>

      <th className="px-6 py-4 text-left">Warehouse</th>

      <th className="px-6 py-4 text-left">Stock</th>

      <th className="px-6 py-4 text-left">Value</th>

      </tr>

      </thead>

      <tbody>

      {inventory.map((item)=>(

      <tr key={item.id} className="border-t hover:bg-slate-50">

      <td className="px-6 py-5">{item.sku}</td>

      <td className="px-6 py-5 font-medium">{item.item_name}</td>

      <td className="px-6 py-5">{item.warehouse}</td>

      <td className="px-6 py-5">{item.stock}</td>

      <td className="px-6 py-5">

      ₦{(item.stock*item.unit_price).toLocaleString()}

      </td>

      </tr>

      ))}

      </tbody>

      </table>

      </div>

      )}

      {selectedReport==="warehouses" && (

      <div className="bg-white rounded-3xl border mt-8 overflow-hidden">

      <table className="w-full">

      <thead className="bg-slate-50">

      <tr>

      <th className="px-6 py-4 text-left">Warehouse</th>

      <th className="px-6 py-4 text-left">Code</th>

      <th className="px-6 py-4 text-left">Location</th>

      </tr>

      </thead>

      <tbody>

      {warehouses.map((warehouse)=>(

      <tr key={warehouse.id} className="border-t">

      <td className="px-6 py-5 font-medium">

      {warehouse.warehouse_name}

      </td>

      <td className="px-6 py-5">

      {warehouse.warehouse_code}

      </td>

      <td className="px-6 py-5">

      {warehouse.location}

      </td>

      </tr>

      ))}

      </tbody>

      </table>

      </div>

      )}

      {selectedReport==="lowstock" && (

      <div className="bg-white rounded-3xl border mt-8 overflow-hidden">

      <table className="w-full">

      <thead className="bg-slate-50">

      <tr>

      <th className="px-6 py-4 text-left">Item</th>

      <th className="px-6 py-4 text-left">Warehouse</th>

      <th className="px-6 py-4 text-left">Stock</th>

      <th className="px-6 py-4 text-left">ROP</th>

      </tr>

      </thead>

      <tbody>

      {inventory
.filter(item=>item.stock<=item.rop)
.map((item)=>(

      <tr key={item.id} className="border-t">

      <td className="px-6 py-5 font-medium">

      {item.item_name}

      </td>

      <td className="px-6 py-5">

      {item.warehouse}

      </td>

      <td className="px-6 py-5 text-red-600 font-bold">

      {item.stock}

      </td>

      <td className="px-6 py-5">

      {item.rop}

      </td>

      </tr>

      ))}

      </tbody>

      </table>

      </div>

      )}

      {selectedReport==="users" && (

      <div className="bg-white rounded-3xl border mt-8 overflow-hidden">

      <table className="w-full">

      <thead className="bg-slate-50">

      <tr>

      <th className="px-6 py-4 text-left">Name</th>

      <th className="px-6 py-4 text-left">Role</th>

      <th className="px-6 py-4 text-left">Warehouse</th>

      <th className="px-6 py-4 text-left">Status</th>

      </tr>

      </thead>

      <tbody>

      {users.map((user)=>(

      <tr key={user.id} className="border-t">

      <td className="px-6 py-5 font-medium">

      {user.full_name}

      </td>

      <td className="px-6 py-5">

      {user.role}

      </td>

      <td className="px-6 py-5">

      {user.warehouse}

      </td>

      <td className="px-6 py-5">

      {user.status}

      </td>

      </tr>

      ))}

      </tbody>

      </table>

      </div>

      )}
    </div>
  );
}
