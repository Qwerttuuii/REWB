import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Warehouse,
  Users,
  Bell,
  FileBarChart,
  LogOut,
  User,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  warehouse: string;
  email: string;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Inventory", icon: Package, path: "/admin/inventory" },
  { label: "Transactions", icon: ArrowRightLeft, path: "/admin/transactions" },
  { label: "Purchase Requests", icon: ClipboardList, path: "/admin/purchase-requests" },
  { label: "Warehouses", icon: Warehouse, path: "/admin/warehouses" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Alerts", icon: Bell, path: "/admin/alerts" },
  { label: "Reports", icon: FileBarChart, path: "/admin/reports" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAdminProfile(data);
    } catch (error) {
      console.error('Error loading admin profile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex lg:h-screen lg:overflow-hidden">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">REWB CORE</h1>
          <p className="text-[11px] uppercase text-slate-500">Admin Portal</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl border border-slate-200 p-2 text-slate-700"
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin navigation overlay"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-[#0f172a] text-white border-r border-slate-700 transition-transform duration-300 lg:relative lg:z-20 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">REWB CORE</h1>
              <p className="text-xs text-slate-400 -mt-1">Admin Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
            aria-label="Close admin navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-4">
          <div className="px-4 py-2 text-xs uppercase tracking-widest text-slate-500 mb-2">
            Administration
          </div>
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Info */}
        <div className="mt-auto p-6">
          <div className="bg-slate-800/80 rounded-3xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {adminProfile?.full_name || 'Administrator'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {adminProfile?.role || 'admin'} · All Sites
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  );
}
