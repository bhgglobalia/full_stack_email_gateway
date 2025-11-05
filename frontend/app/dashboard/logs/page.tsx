
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

import { useUnreadLogsStore } from "@/store/unreadLogs";
import { usePathname } from "next/navigation";
import { Download, RefreshCw, Mail } from "lucide-react";
import io from "socket.io-client";



const PROVIDERS = ["google", "outlook"];

export default function LogsPage() {
  const reset = useUnreadLogsStore((s) => s.reset);
  useEffect(() => { reset(); }, [reset]);
 
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [provider, setProvider] = useState("");
  const [client, setClient] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    api.get("/clients").then((res) => {
      setClients(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (provider) params.provider = provider;
      if (client) params.clientId = String(client);
      if (date) params.date = date;
      const query = Object.keys(params).map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
      const res = await api.get(`/events${query ? '?' + query : ''}`);
      setLogs(Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const incrementUnread = useUnreadLogsStore((s) => s.increment);
  const resetUnread = useUnreadLogsStore((s) => s.reset);
  const pathname = usePathname();

  
  useEffect(() => {
    fetchLogs();
  }, [provider, client, date]);

  useEffect(() => {
    resetUnread(); 
  }, [pathname, resetUnread]);

  const handleDownloadCSV = () => {
    const csv = [
      ...logs.map((l) => [
        l.id,
        l.mailbox?.email || "",
        l.direction,
        l.status,
        new Date(l.timestamp).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_logs.csv";
    a.click();
  };

  return (
    <div className="p-8 text-black">
       <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="text-blue-600" /> Email Logs ({logs.length})
        </h1>
        <div className="flex gap-3">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
      </div>

      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-4 items-center mb-6 shadow-sm">
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="">All Providers</option>
            {PROVIDERS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Client</label>
          <select value={client} onChange={e => setClient(e.target.value)} className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="">All Clients</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
      </div>

  
      <div className="bg-white rounded-xl shadow border border-gray-300 overflow-x-auto">
        <table className="min-w-full border-collapse text-black">
          <thead className="bg-gray-200 text-black text-sm">
            <tr>
              <th className="text-left p-3 font-semibold">ID</th>
              <th className="text-left p-3 font-semibold">Mailbox</th>
              <th className="text-left p-3 font-semibold">Subject</th>
              <th className="text-left p-3 font-semibold">Provider</th>
              <th className="text-left p-3 font-semibold">Direction</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Timestamp</th>
              <th className="text-left p-3 font-semibold">Attachments</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr
                key={l.id}
                className={`${
                  i % 2 === 0 ? "bg-gray-100" : "bg-white"
                } border-t hover:bg-blue-100 transition`}
              >
                <td className="p-3">{l.id}</td>
                <td className="p-3">{l.mailbox?.email || "-"}</td>
                <td className="p-3">{l.subject || '-'}</td>
                <td className="p-3">{l.provider || '-'}</td>
                <td className="p-3 capitalize">{l.direction}</td>
                <td className="p-3">
  {(() => {
    const s = String(l.status || '').toLowerCase();
    const isOk = ['ok', 'success', 'sent', 'delivered'].includes(s);
    if (isOk) {
      return (
        <span
          title="Delivered/Sent successfully"
          className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700"
        >
          OK
        </span>
      );
    }
    
    if (l.direction === 'outbound') {
      return (
        <a
          href="/dashboard/mailboxes"
          title="Send failed (e.g., expired token). Click to refresh mailbox token."
          className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 underline"
        >
          FAIL
        </a>
      );
    }
    return (
      <span
        title="Processing failed"
        className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700"
      >
        FAIL
      </span>
    );
  })()}
</td>
                <td className="p-3">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '-'}</td>
                <td className="p-3">
                  {Array.isArray(l.attachments) && l.attachments.length > 0
                    ? l.attachments.map((a: any, idx: number) => (
                        <span key={idx} className="block text-xs">
                          {a.name || a.filename}
                        </span>
                      ))
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
  );
}




