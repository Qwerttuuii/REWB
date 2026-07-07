import { useEffect, useState } from "react";
import { Users, Search, Shield, UserCheck, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  warehouse: string;
  status: string;
  created_at: string;
}

const avatarColor = (name: string) => {
  const colours = [
    "bg-emerald-600", 
    
  ];
  return colours[(name?.charCodeAt(0) || 0) % colours.length];
};

const roleBadge = (role: string) => {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <Shield className="w-3 h-3" /> Administrator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <UserCheck className="w-3 h-3" /> Stores Manager
    </span>
  );
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
    loadWarehouses();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const loadWarehouses = async () => {
    const { data } = await supabase
      .from("warehouses")
      .select("warehouse_code, warehouse_name")
      .order("warehouse_name");
    setWarehouses(data || []);
  };

  const toggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", user.id);
    if (error) { alert(error.message); return; }
    loadUsers();
  };

  const updateUser = async () => {
    if (!selectedUser) return;
    setEditSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: selectedUser.full_name,
        role: selectedUser.role,
        warehouse: selectedUser.warehouse,
      })
      .eq("id", selectedUser.id);
    if (error) { alert(error.message); setEditSubmitting(false); return; }
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
    setEditSubmitting(false);
  };

  const filteredUsers = users.filter((user) => {
    const s = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(s) ||
      user.email?.toLowerCase().includes(s) ||
      user.role?.toLowerCase().includes(s) ||
      user.warehouse?.toLowerCase().includes(s)
    );
  });

  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const managers = users.filter((u) => u.role === "stores_manager").length;
  const activeUsers = users.filter((u) => u.status !== "Inactive").length;

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-500 mt-1">
            {totalUsers} accounts · {activeUsers} active
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {[
            { label: "TOTAL USERS", value: totalUsers, icon: Users, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
            { label: "ADMINISTRATORS", value: admins, icon: Shield, iconBg: "bg-red-100", iconColor: "text-red-600" },
            { label: "STORES MANAGERS", value: managers, icon: UserCheck, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
            { label: "ACTIVE", value: activeUsers, icon: Users, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                  <h2 className="text-3xl sm:text-4xl font-bold mt-4">{card.value}</h2>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search by name, email, role or warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-5 text-sm font-medium text-gray-500">USER</th>
                <th className="text-left p-5 text-sm font-medium text-gray-500">EMAIL</th>
                <th className="text-left p-5 text-sm font-medium text-gray-500">ROLE</th>
                <th className="text-left p-5 text-sm font-medium text-gray-500">ASSIGNED WAREHOUSE</th>
                <th className="text-left p-5 text-sm font-medium text-gray-500">STATUS</th>
                <th className="text-left p-5 text-sm font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50 transition">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl ${avatarColor(user.full_name)} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                          {user.full_name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {user.role === "admin"
                              ? "System Administrator"
                              : `Stores Manager${user.warehouse ? ` — ${user.warehouse}` : ""}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 text-sm">{user.email}</td>
                    <td className="p-5">{roleBadge(user.role)}</td>
                    <td className="p-5 text-gray-600 text-sm">{user.warehouse || "—"}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === "Active" || !user.status
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "Active" || !user.status ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`text-sm font-medium transition ${
                            user.status === "Active" || !user.status
                              ? "text-red-500 hover:text-red-600"
                              : "text-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          {user.status === "Active" || !user.status ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          REWB CORE · NNPC Ltd · Administration Portal
        </div>

      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-8">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                <p className="text-gray-500 text-sm mt-0.5">Update user information and access.</p>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">FULL NAME</label>
                <input
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={selectedUser.full_name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EMAIL</label>
                <input
                  disabled
                  className="w-full border border-gray-100 rounded-2xl p-4 bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={selectedUser.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ROLE</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                >
                  <option value="admin">Administrator</option>
                  <option value="stores_manager">Stores Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ASSIGN WAREHOUSE</label>
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-emerald-500"
                  value={selectedUser.warehouse || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, warehouse: e.target.value })}
                >
                  <option value="">No warehouse assigned</option>
                  {warehouses.map((w) => (
                    <option key={w.warehouse_code} value={w.warehouse_code}>
                      {w.warehouse_code} — {w.warehouse_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                disabled={editSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updateUser}
                disabled={editSubmitting}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
