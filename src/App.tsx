import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Menu, X, ArrowRight, Shield, Truck, Bell, BarChart3, Users, FileText } from 'lucide-react';
import heroImage from './assets/warehouse2.jpg';
import LoginPage from './pages/login';
import SignupPage from './pages/Signup';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Transactions from "./pages/Transactions";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminAlerts from "./pages/admin/AdminAlerts";
import PurchaseRequests from "./pages/admin/PurchaseRequests";
import AdminWarehouses from "./pages/admin/AdminWarehouses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReports from "./pages/admin/AdminReports";
function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Transparent */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">REWB CORE</h1>
              <p className="text-[10px] text-gray-500 -mt-1">INTELLIGENT INVENTORY</p>
            </div>
          </div>
     
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden md:block px-6 py-2.5 bg-white/80 hover:bg-white text-gray-900 font-semibold rounded-2xl transition border border-gray-200"
            >
              Sign in to REWB CORE
            </Link>
            <Link
              to="/login"
              className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-semibold items-center gap-2 transition"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg md:hidden">
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl border border-gray-200 px-4 py-3 text-center font-semibold text-gray-900"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-center font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background Image with Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl">
          
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
              Smarter inventory control<br />
              across every <span className="text-emerald-400">refinery, depot & rig</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-200 mb-10 mx-auto">
              REWB CORE gives you realtime visibility into stock levels, intelligent reorder recommendations, and a complete audit trail designed specifically for oil & gas supply chains.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/login"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 py-4 rounded-2xl font-semibold text-base sm:text-lg flex items-center gap-3 transition"
              >
                Access the system <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "WAREHOUSES", value: "Unlimited", sub: "Refineries, depots & rigs" },
            { label: "SKUS TRACKED", value: "180+", sub: "Valves, pumps, chemicals & more" },
            { label: "UPTIME", value: "99.9%", sub: "Cloud-backed reliability" },
            { label: "REORDER ALERTS", value: "Real-time", sub: "ABC/VED + ROP intelligence" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-5xl font-bold text-emerald-600 mb-1">{stat.value}</div>
              <div className="font-semibold text-gray-900">{stat.label}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Everything your stores team needs</h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              From stock receipts to critical item alerts, REWB CORE covers the full inventory lifecycle.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-8 h-8 text-emerald-600" />,
                title: "ABC / VED Classification",
                desc: "Automatically classify items by value and criticality so you know exactly where to focus."
              },
              {
                icon: <Truck className="w-8 h-8 text-emerald-600" />,
                title: "Multi-Warehouse Tracking",
                desc: "Track stock across refineries, flow stations, depots, and offshore rigs in one unified view."
              },
              {
                icon: <Bell className="w-8 h-8 text-emerald-600" />,
                title: "Smart Reorder Alerts",
                desc: "Get notified when stock hits reorder point with EOQ suggestions and supplier lead times."
              },
              {
                icon: <Shield className="w-8 h-8 text-emerald-600" />,
                title: "Full Audit Trail",
                desc: "Every stock movement is logged with user, timestamp, and reference for compliance."
              },
              {
                icon: <Users className="w-8 h-8 text-emerald-600" />,
                title: "Real-Time Dashboard",
                desc: "See total value, low-stock warnings, and recent transactions at a glance."
              },
              {
                icon: <FileText className="w-8 h-8 text-emerald-600" />,
                title: "Reports & Exports",
                desc: "Generate stock status, valuation, and transaction reports ready for management review."
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 hover:border-emerald-200 hover:shadow-xl transition-all group">
                <div className="mb-6 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-100 transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-24 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">Ready to streamline your inventory?</h2>
          <p className="text-base sm:text-xl text-gray-400 mb-10">Sign in to access the REWB CORE dashboard and start managing stock smarter.</p>
          
          <Link
            to="/login"
            className="bg-white text-gray-900 px-6 sm:px-10 py-4 rounded-2xl font-semibold text-base sm:text-lg inline-flex items-center gap-3 mx-auto hover:bg-gray-100 transition"
          >
            Sign in to REWB CORE <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-3 justify-between items-center text-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>© 2026 REWB CORE </span>
          </div>
          <div>Demonstration build • Synthetic data</div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ================= USER DASHBOARD ================= */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="stock" element={<Stock />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* ================= ADMIN DASHBOARD ================= */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="alerts" element={<AdminAlerts />} />
        <Route path="purchase-requests" element={<PurchaseRequests />} />
        <Route path="warehouses" element={<AdminWarehouses />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />

      </Route>
    </Routes>
  );
}

export default App;
