"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { io } from "socket.io-client";
import { Plus } from "lucide-react";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");
export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", emailProvider: "", domain: "" });

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  useEffect(() => {
    fetchClients();

    socket.on("clientAdded", () => {
       
        fetchClients();
      });

    socket.on("mailboxAdded", () => {
      fetchClients();
    });


      return () => {
        socket.off("clientAdded");
        socket.off("mailboxAdded");
      };
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.emailProvider || !form.domain) return;
    try {
      await api.post("/clients", form);
      setShowModal(false);
      setForm({ name: "", emailProvider: "", domain: "" });
      fetchClients();
    } catch (err) {
      console.error("Failed to add client", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">Clients ({clients.length})</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-300 overflow-x-auto">
        <table className="min-w-full border-collapse text-black">
          <thead className="bg-gray-200 text-black text-sm">
            <tr>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Domain</th>
              <th className="text-left p-3 font-semibold">Provider</th>
              <th className="text-left p-3 font-semibold">Mailboxes</th>
              <th className="text-left p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr
                key={c.id}
                className={`${
                  i % 2 === 0 ? "bg-gray-100" : "bg-white"
                } border-t hover:bg-blue-100 transition`}
              >
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.domain}</td>
                <td className="p-3 capitalize">{c.emailProvider || '-'}</td>
                <td className="p-3">{c.mailboxes || 0}</td>
                <td className="p-3">
                  {c.status === "active" ? (
                    <span className="text-green-600 font-semibold">✅ Active</span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">⚠️ Token Expired</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
  <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl p-6 w-96 shadow-xl text-black">
      <h2 className="text-xl font-bold mb-4 text-black">Add Client</h2>

      <input
        type="text"
        placeholder="Client Name"
        className="w-full border p-2.5 mb-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        type="text"
        placeholder="Company Domain"
        className="w-full border p-2.5 mb-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={form.domain}
        onChange={(e) => setForm({ ...form, domain: e.target.value })}
      />

      <input
        type="text"
        placeholder="Email Provider"
        className="w-full border p-2.5 mb-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={form.emailProvider}
        onChange={(e) => setForm({ ...form, emailProvider: e.target.value })}
      />

      <div className="flex justify-end gap-3 mt-2">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 rounded-lg border border-gray-400 text-black hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
