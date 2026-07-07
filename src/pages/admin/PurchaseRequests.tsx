import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function PurchaseRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const { data } = await supabase
      .from("purchase_requests")
      .select(`
        *,
        inventory_items:item_id(
          item_name,
          sku
        ),
        requester:requested_by(
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    setRequests(data || []);
    setLoading(false);
  }

  const filtered = requests.filter((r) => {
    const matchesStatus =
      status === "All" ? true : r.status === status;

    const matchesSearch =
      r.request_no?.toLowerCase().includes(search.toLowerCase()) ||
      r.inventory_items?.item_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      r.inventory_items?.sku
        ?.toLowerCase()
        .includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  async function updateStatus(
    id: string,
    newStatus: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("purchase_requests")
      .update({
        status: newStatus,
        approved_by: user?.id,
        approved_at: new Date(),
      })
      .eq("id", id);

    loadRequests();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Purchase Requests
          </h1>

          <p className="text-gray-500 mt-1">
            Manage procurement requests
          </p>
        </div>

      </div>

      <div className="bg-white rounded-3xl border">

        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">

          <div className="relative flex-1">

            <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5"/>

            <input
              placeholder="Search..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="w-full border rounded-xl pl-12 pr-4 py-3"
            />

          </div>

          <select
            value={status}
            onChange={(e)=>setStatus(e.target.value)}
            className="border rounded-xl px-4 py-3"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>

        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">

          <thead className="bg-gray-50">

            <tr>

              <th className="text-left p-4">Request</th>

              <th>Item</th>

              <th>Qty</th>

              <th>Warehouse</th>

              <th>Status</th>

              <th>Requester</th>

              <th>Date</th>

              <th></th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td colSpan={8} className="p-8 text-center">

                  Loading...

                </td>

              </tr>

            ) : filtered.length === 0 ? (

              <tr>

                <td colSpan={8} className="p-8 text-center">

                  No requests found.

                </td>

              </tr>

            ) : (

              filtered.map((r)=>(

                <tr
                  key={r.id}
                  onClick={() => {
                    setSelectedRequest(r);
                    setShowDrawer(true);
                  }}
                  className="border-t hover:bg-gray-50 cursor-pointer transition"
                >

                  <td className="p-4 font-semibold">
                    {r.request_no}
                  </td>

                  <td>

                    <div>

                      <div className="font-medium">
                        {r.inventory_items?.item_name}
                      </div>

                      <div className="text-xs text-gray-500">
                        {r.inventory_items?.sku}
                      </div>

                    </div>

                  </td>

                  <td>{r.quantity}</td>

                  <td>{r.warehouse}</td>

                  <td>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium

                      ${
                        r.status==="Pending"
                        ?"bg-yellow-100 text-yellow-700"
                        :r.status==="Approved"
                        ?"bg-green-100 text-green-700"
                        :"bg-red-100 text-red-700"
                      }

                      `}
                    >

                      {r.status}

                    </span>

                  </td>

                  <td>

                    {r.requester?.full_name}

                  </td>

                  <td>

                    {new Date(r.created_at).toLocaleDateString()}

                  </td>

                  <td>
                    <span className="text-sm text-gray-500">Click to view</span>
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>
        </div>

      </div>

      {showDrawer && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-end z-50"
          onClick={() => setShowDrawer(false)}
        >
          <div
            className="bg-white w-full max-w-xl h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-8 border-b">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Purchase Request</h2>
                  <p className="text-gray-500">{selectedRequest.request_no}</p>
                </div>

                <button
                  onClick={() => setShowDrawer(false)}
                  className="text-4xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-8">
              <div>
                <p className="text-sm text-gray-500">Item</p>
                <h3 className="text-2xl font-semibold">
                  {selectedRequest.inventory_items?.item_name}
                </h3>
                <p className="text-gray-500">{selectedRequest.inventory_items?.sku}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Warehouse</p>
                  <p>{selectedRequest.warehouse}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p>{selectedRequest.supplier}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <h3 className="text-3xl font-bold">{selectedRequest.quantity}</h3>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>{selectedRequest.status}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Notes</p>
                <div className="bg-gray-100 rounded-xl p-4">
                  {selectedRequest.notes || "No notes provided."}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Requested By</p>
                <p>{selectedRequest.requester?.full_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date Requested</p>
                <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>

              {selectedRequest.status === "Pending" && (
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => {
                      updateStatus(selectedRequest.id, "Rejected");
                      setShowDrawer(false);
                    }}
                    className="flex-1 border border-red-600 text-red-600 rounded-2xl py-4"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => {
                      updateStatus(selectedRequest.id, "Approved");
                      setShowDrawer(false);
                    }}
                    className="flex-1 bg-emerald-600 text-white rounded-2xl py-4"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
