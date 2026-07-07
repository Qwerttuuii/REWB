import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Package,
  Warehouse,
  Users,
  AlertTriangle,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  RotateCcw,
  FileBarChart,
  Search,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ── TypeScript interfaces ──────────────────────────────────────────────
interface DashboardStats {
  inventoryValue: number;
  products: number;
  warehouses: number;
  users: number;
  lowStock: number;
  pendingRequests: number;
}

interface InventoryItem {
  id: string;
  item_name: string;
  sku: string;
  stock: number;
  rop: number;
  max_stock: number;
  unit_price: number;
  unit_of_measure: string;
  warehouse: string;
}

interface Transaction {
  id: string;
  reference: string;
  transaction_type: string;
  quantity: number;
  created_at: string;
  inventory_items: {
    item_name: string;
    sku: string;
  } | null;
}

// ── KPI Card component (will become components/admin/KPICard.tsx later) ─
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function KPICard({ title, value, icon: Icon, iconBg, iconColor }: KPICardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm min-w-0">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
          <h2 className="text-lg sm:text-xl font-bold mt-4 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
            {value}
          </h2>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    inventoryValue: 0,
    products: 0,
    warehouses: 0,
    users: 0,
    lowStock: 0,
    pendingRequests: 0,
  });

  const [activities, setActivities] = useState<Transaction[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: inventory } = await supabase
        .from("inventory_items")
        .select("*");

      const { data: warehouses } = await supabase
        .from("warehouses")
        .select("*");

      const { data: users } = await supabase
        .from("profiles")
        .select("*");

      const { data: requests } = await supabase
        .from("purchase_requests")
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

      if (!inventory) return;

      const inventoryValue = inventory.reduce(
        (sum, item) => sum + item.stock * Number(item.unit_price),
        0
      );

      const lowStock = inventory.filter(
        (i: InventoryItem) => i.stock <= i.rop
      );

      setStats({
        inventoryValue,
        products: inventory.length,
        warehouses: warehouses?.length || 0,
        users: users?.length || 0,
        lowStock: lowStock.length,
        pendingRequests:
          requests?.filter((r: { status: string }) => r.status === "Pending").length || 0,
      });

      setActivities((transactions as Transaction[]) || []);
      setLowStockItems((lowStock as InventoryItem[]).slice(0, 5));
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Receipt":   return <ArrowDown className="w-4 h-4 text-emerald-600" />;
      case "Issue":     return <ArrowUp className="w-4 h-4 text-red-500" />;
      case "Transfer":  return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
      case "Return":    return <RotateCcw className="w-4 h-4 text-purple-500" />;
      default:          return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case "Receipt":   return "bg-emerald-100";
      case "Issue":     return "bg-red-100";
      case "Transfer":  return "bg-blue-100";
      case "Return":    return "bg-purple-100";
      default:          return "bg-gray-100";
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "Receipt":    return "bg-emerald-100 text-emerald-700";
      case "Issue":      return "bg-red-100 text-red-700";
      case "Transfer":   return "bg-blue-100 text-blue-700";
      case "Return":     return "bg-purple-100 text-purple-700";
      case "Adjustment": return "bg-amber-100 text-amber-700";
      default:           return "bg-gray-100 text-gray-700";
    }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/admin/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const kpiCards: KPICardProps[] = [
    {
      title: "INVENTORY VALUE",
      value: `₦${stats.inventoryValue.toLocaleString()}`,
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "TOTAL SKUs",
      value: stats.products,
      icon: Package,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "WAREHOUSES",
      value: stats.warehouses,
      icon: Warehouse,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "USERS",
      value: stats.users,
      icon: Users,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "LOW STOCK",
      value: stats.lowStock,
      icon: AlertTriangle,
      iconBg: stats.lowStock > 0 ? "bg-amber-100" : "bg-emerald-100",
      iconColor: stats.lowStock > 0 ? "text-amber-600" : "text-emerald-600",
    },
    {
      title: "PENDING REQUESTS",
      value: stats.pendingRequests,
      icon: ClipboardList,
      iconBg: stats.pendingRequests > 0 ? "bg-red-100" : "bg-emerald-100",
      iconColor: stats.pendingRequests > 0 ? "text-red-600" : "text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Top Navigation Bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 sticky top-0 z-10">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-4 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder="Search inventory, transactions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ── Page Content ──────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 lg:mb-10 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Operations Dashboard</h1>
              <p className="text-gray-500 mt-1">
                System-wide view across all NNPC warehouses, depots and rigs
              </p>
            </div>
            <button className="flex w-full sm:w-auto items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-semibold transition">
              <FileBarChart className="w-5 h-5" />
              View Reports
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
            {kpiCards.map((card) => (
              <KPICard key={card.title} {...card} />
            ))}
          </div>

          {/* Bottom panels */}
          <div className="grid md:grid-cols-2 gap-6">

            {/* Low Stock */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Low stock across warehouses</h3>
                <Link
                  to="/admin/alerts"
                  className="text-emerald-600 hover:underline text-sm"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-gray-500">All inventory levels are healthy.</p>
                ) : (
                  lowStockItems.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-2xl flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-sm text-gray-500">{item.sku}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.warehouse}</p>
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

            {/* Recent Transactions */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Recent transactions</h3>
                <Link
                  to="/admin/transactions"
                  className="text-emerald-600 hover:underline text-sm"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500">No transactions recorded yet.</p>
                ) : (
                  activities.map((txn) => (
                    <div key={txn.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getActivityIconBg(txn.transaction_type)}`}>
                          {getActivityIcon(txn.transaction_type)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {txn.inventory_items?.item_name || "—"}
                          </p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getActivityBadge(txn.transaction_type)}`}>
                            {txn.transaction_type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{txn.quantity}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-400">
            REWB CORE · NNPC Ltd · Administration Portal
          </div>

        </div>
      </div>
    </div>
  );
}