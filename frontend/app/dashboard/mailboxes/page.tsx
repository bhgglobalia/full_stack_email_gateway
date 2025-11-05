 
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Mail, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { io } from "socket.io-client";
 
const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");
 
export default function MailboxesPage() {
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState<Set<number>>(new Set());
  const [recentlyRefreshed, setRecentlyRefreshed] = useState<Set<number>>(new Set());
  const markRecentlyRefreshed = (id: number, ms = 3000) => {
    setRecentlyRefreshed(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setRecentlyRefreshed(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, ms);
  };
  const selectedClient = clients.find((c: any) => c.id === selectedClientId);
  const selectedProvider: string | undefined = selectedClient?.emailProvider;
  const selectedProviderNormRaw = selectedProvider ? String(selectedProvider).trim().toLowerCase() : undefined;
  const selectedProviderCanon = selectedProviderNormRaw
    ? (selectedProviderNormRaw.includes('google') || selectedProviderNormRaw.includes('gmail')
        ? 'google'
        : (selectedProviderNormRaw.includes('outlook') || selectedProviderNormRaw.includes('microsoft') ? 'outlook' : selectedProviderNormRaw))
    : undefined;
  const selectedProviderPretty = selectedProviderCanon
    ? selectedProviderCanon.charAt(0).toUpperCase() + selectedProviderCanon.slice(1)
    : undefined;
 
  const fetchMailboxes = async () => {
    try {
      const res = await api.get("/mailboxes");
      setMailboxes(Array.isArray(res.data.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch mailboxes", err);
    }
  };
 
  const refreshMailbox = async (id: number) => {
    try {
      setRefreshing(prev => new Set(prev).add(id));
      await api.patch(`/mailboxes/${id}/refresh`);
      setBanner({ type: 'success', text: 'Token refreshed' });
      markRecentlyRefreshed(id);
    } catch (e) {
      console.error('Failed to refresh token', e);
      setBanner({ type: 'error', text: 'Failed to refresh token' });
    } finally {
      await fetchMailboxes();
      setRefreshing(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };
 
  useEffect(() => {
    fetchMailboxes();
  
    (async () => {
      try {
        const res = await api.get("/clients");
        setClients(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        setClients([]);
      }
    })();
   
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const connected = url.searchParams.get('connected');
      const error = url.searchParams.get('error');
      if (connected) {
        setBanner({ type: 'success', text: `Connected ${connected} mailbox successfully.` });
      } else if (error) {
        setBanner({ type: 'error', text: decodeURIComponent(error) });
      }
      if (connected || error) {
        url.searchParams.delete('connected');
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
      }
    }
 
    socket.on('mailboxAdded', (mb: any) => {
      setBanner({ type: 'success', text: `Mailbox connected: ${mb?.email || ''}` });
      fetchMailboxes();
    });
 
    
    socket.on('mailboxUpdated', (mb: any) => {
      if (mb?.id) markRecentlyRefreshed(mb.id);
      setBanner({ type: 'success', text: 'Mailbox status refreshed' });
      fetchMailboxes();
    });
 
    return () => {
      socket.off('mailboxAdded');
      socket.off('mailboxUpdated');
    };
  }, []);
 
  const connectGmail = async () => {
    if (!selectedClientId) {
      alert("Please select a client first");
      return;
    }
    const email = prompt("Enter mailbox email (for demo)", "user@google.example") || "";
    const res = await api.get(`/mailboxes/oauth/google?clientId=${selectedClientId}&email=${encodeURIComponent(email)}`);
    if (res.data.success && res.data.redirectUrl) {
      window.location.href = res.data.redirectUrl;
    }
  };
 
  const connectOutlook = async () => {
    if (!selectedClientId) {
      alert("Please select a client first");
      return;
    }
    try {
      const email = prompt("Enter mailbox email (for demo)", "user@outlook.example") || "";
      const res = await api.get(`/mailboxes/oauth/outlook?clientId=${selectedClientId}&email=${encodeURIComponent(email)}`);
      if (res.data.success && res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
    } catch (e) {
      console.error("Failed to start Outlook OAuth", e);
      alert("Failed to start Outlook OAuth");
    }
  };
 
  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-lg border border-gray-200 rounded-2xl px-2 sm:px-6 md:px-12 py-4 sm:py-10 mt-2 sm:mt-6 md:mt-10 overflow-x-auto text-black">
      {banner && (
        <div className={`mb-4 p-3 rounded text-center text-sm sm:text-base ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {banner.text}
        </div>
      )}
 
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Mail className="text-blue-600" /> Mailboxes (Active: {mailboxes.filter(m => m.status === 'active').length})
        </h1>
 
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            className="border rounded px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Client</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={connectGmail}
            disabled={!!selectedProviderCanon && selectedProviderCanon !== 'google'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-white text-sm font-medium ${!!selectedProviderCanon && selectedProviderCanon !== 'google' ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <Plus size={18} /> Connect Gmail
          </button>
          <button
            onClick={connectOutlook}
            disabled={!!selectedProviderCanon && selectedProviderCanon !== 'outlook'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-white text-sm font-medium ${!!selectedProviderCanon && selectedProviderCanon !== 'outlook' ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Plus size={18} /> Connect Outlook
          </button>
        </div>
      </div>
      {selectedClientId && (
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          {selectedProviderCanon
            ? `This client is bound to ${selectedProviderPretty}. Only that provider can be connected.`
            : 'No provider bound yet for this client. You can choose either Gmail or Outlook.'}
        </p>
      )}
 
      <div className="bg-white rounded-xl shadow border border-gray-300 overflow-x-auto w-full">
        <table className="min-w-[600px] w-full border-collapse text-black text-xs sm:text-sm md:text-base">
          <thead className="bg-gray-200 text-black">
            <tr>
              <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">User Email</th>
              <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Provider</th>
              <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Client</th>
              <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Status</th>
              <th className="text-left p-2 sm:p-3 font-semibold whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mailboxes.map((m, i) => (
              <tr
                key={m.id}
                className={`${i % 2 === 0 ? "bg-gray-100" : "bg-white"} border-t hover:bg-blue-100 transition-all`}
              >
                <td className="p-2 sm:p-3 break-all max-w-[200px]">{m.email}</td>
                <td className="p-2 sm:p-3 capitalize break-all max-w-[120px]">{m.provider}</td>
                <td className="p-2 sm:p-3 break-all max-w-[160px]">{m.client?.name || "-"}</td>
                <td className="p-2 sm:p-3">
                  {refreshing.has(m.id) || recentlyRefreshed.has(m.id) ? (
                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <RefreshCw size={16} /> Refresh
                    </span>
                  ) : m.status === "active" ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle2 size={16} /> Active
                    </span>
                  ) : m.status === "refresh" ? (
                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <RefreshCw size={16} /> Refresh
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 font-semibold">
                      <AlertTriangle size={16} /> Expired
                    </span>
                  )}
                </td>
                <td className="p-2 sm:p-3">
                  <button
                    onClick={() => refreshMailbox(m.id)}
                    className="inline-flex items-center gap-2 border px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 text-xs sm:text-sm"
                    disabled={refreshing.has(m.id)}
                    title="Refresh token"
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
 
 