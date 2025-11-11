"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Plus, Mail, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Client, Mailbox } from "@/app/types";
import { useSocket } from "@/hooks/useSocket";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function MailboxesPage() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState<Set<number>>(new Set());
  const [recentlyRefreshed, setRecentlyRefreshed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchMailboxes = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Mailbox[] }>("/mailboxes");
      setMailboxes(Array.isArray(res.data.data) ? res.data.data : []);
    } catch{
      toast.error("Failed to fetch mailboxes", { id: "fetch-mailboxes" });
    }finally {
      setLoading(false);
    }
  };

  useSocket(
    useCallback((event: string, data: unknown) => {
      if (event === "mailboxAdded") {
        const mb = data as Mailbox;
        setBanner({ type: "success", text: `Mailbox connected: ${mb.email}` });
        fetchMailboxes();
      }
      if (event === "mailboxUpdated") {
        const mb = data as Mailbox;
        if (mb.id) markRecentlyRefreshed(mb.id);
        setBanner({ type: "success", text: "Mailbox status refreshed" });
        fetchMailboxes();
      }
    }, [])
  );



  const markRecentlyRefreshed = (id: number, ms = 3000) => {
    setRecentlyRefreshed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setRecentlyRefreshed((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, ms);
  };

  const selectedClient = clients.find((c) => String(c.id) === selectedClientId);
  const selectedProvider = selectedClient?.emailProvider;

  const selectedProviderNormRaw = selectedProvider ? selectedProvider.trim().toLowerCase() : undefined;
  const selectedProviderCanon = selectedProviderNormRaw
    ? selectedProviderNormRaw.includes("google") || selectedProviderNormRaw.includes("gmail")
      ? "google"
      : selectedProviderNormRaw.includes("outlook") || selectedProviderNormRaw.includes("microsoft")
      ? "outlook"
      : selectedProviderNormRaw
    : undefined;

  const selectedProviderPretty = selectedProviderCanon
    ? selectedProviderCanon.charAt(0).toUpperCase() + selectedProviderCanon.slice(1)
    : undefined;


  const refreshMailbox = async (id: number) => {
    try {
      setRefreshing((prev) => new Set(prev).add(id));
      await api.patch(`/mailboxes/${id}/refresh`);
      setBanner({ type: "success", text: "Token refreshed" });
      markRecentlyRefreshed(id);
    } catch{
      toast.error("Failed to refresh token", { id: "refresh-mailbox" });
      setBanner({ type: "error", text: "Failed to refresh token" });
    } finally {
      await fetchMailboxes();
      setRefreshing((prev) => {
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
        const res = await api.get<{ data: Client[] }>("/clients");
        setClients(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        setClients([]);
      }
    })();

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const connected = url.searchParams.get("connected");
      const error = url.searchParams.get("error");

      if (connected) {
        setBanner({ type: "success", text: `Connected ${connected} mailbox successfully.` });
      } else if (error) {
        setBanner({ type: "error", text: decodeURIComponent(error) });
      }

      if (connected || error) {
        url.searchParams.delete("connected");
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.toString());
      }
    }

   
   
  }, []);

  const connectGmail = async () => {
    if (!selectedClientId) {
      alert("Please select a client first");
      return;
    }
    const email = prompt("Enter mailbox email (for demo)", "user@google.example") || "";
    const res = await api.get<{ success: boolean; redirectUrl: string }>(
      `/mailboxes/oauth/google?clientId=${selectedClientId}&email=${encodeURIComponent(email)}`
    );
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
      const res = await api.get<{ success: boolean; redirectUrl: string }>(
        `/mailboxes/oauth/outlook?clientId=${selectedClientId}&email=${encodeURIComponent(email)}`
      );
      if (res.data.success && res.data.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      }
    } catch{
      toast.error("Failed to start Outlook OAuth", { id: "outlook-oauth" });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-lg border border-gray-200 rounded-2xl px-3 sm:px-6 md:px-10 py-4 sm:py-8 mt-2 sm:mt-6 md:mt-10 text-black">
     
     {loading && (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <LoadingSpinner />
    </div>
  )}
      {banner && (
        <div
          className={`mb-4 p-3 rounded text-center text-sm sm:text-base ${
            banner.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {banner.text}
        </div>
      )}
 <div className={`${loading ? "opacity-30 pointer-events-none" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 tracking-tight">
            <Mail className="text-blue-600" /> Mailboxes
          </h1>
          <p className="text-sm text-gray-600 mt-1">Active: {mailboxes.filter((m) => m.status === "active").length}</p>
        </div>


        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
          <label htmlFor="client-select" className="sr-only">
            Select Client
          </label>
          <select
            id="client-select"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Select Client"
          >
            <option value="">Select Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={connectGmail}
            disabled={!!selectedProviderCanon && selectedProviderCanon !== "google"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition text-white text-sm font-medium ${
              !!selectedProviderCanon && selectedProviderCanon !== "google"
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
            aria-label="Connect Gmail"
          >
            <Plus size={18} /> Connect Gmail
          </button>
          <button
            onClick={connectOutlook}
            disabled={!!selectedProviderCanon && selectedProviderCanon !== "outlook"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition text-white text-sm font-medium ${
              !!selectedProviderCanon && selectedProviderCanon !== "outlook"
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            aria-label="Connect Outlook"
          >
            <Plus size={18} /> Connect Outlook
          </button>
        </div>
      </div>


      {selectedClientId && (
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          {selectedProviderCanon
            ? `This client is bound to ${selectedProviderPretty}. Only that provider can be connected.`
            : "No provider bound yet for this client. You can choose either Gmail or Outlook."}
        </p>
      )}

      <div className="sm:hidden grid grid-cols-1 gap-3">
        {mailboxes.map((m) => (
          <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900 break-all">{m.email}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  <span className="capitalize">{m.provider}</span>
                  <span className="mx-1">·</span>
                  <span className="">{m.client?.name || "-"}</span>
                </div>
              </div>
              <div>
                {refreshing.has(m.id) || recentlyRefreshed.has(m.id) ? (
                  <span className="inline-flex items-center gap-1 text-yellow-700 text-sm font-medium">
                    <RefreshCw size={16} /> Refresh
                  </span>
                ) : m.status === "active" ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle2 size={16} /> Active
                  </span>
                ) : m.status === "refresh" ? (
                  <span className="inline-flex items-center gap-1 text-yellow-700 text-sm font-medium">
                    <RefreshCw size={16} /> Refresh
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                    <AlertTriangle size={16} /> Expired
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={() => refreshMailbox(m.id)}
                className="inline-flex items-center gap-2 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 text-xs"
                disabled={refreshing.has(m.id)}
                aria-label="Refresh mailbox token"
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>
        ))}
      </div>


      <div className="hidden sm:block bg-white rounded-xl shadow border border-gray-200 overflow-x-auto w-full">
        {!loading && (
        <table className="min-w-[720px] w-full border-collapse text-black text-sm md:text-base">
          <thead className="bg-gray-100/80 text-black">
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
                className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} border-t hover:bg-blue-50 transition`}
              >
                <td className="p-2 sm:p-3 break-all max-w-[200px]">{m.email}</td>
                <td className="p-2 sm:p-3 capitalize break-all max-w-[120px]">{m.provider}</td>
                <td className="p-2 sm:p-3 break-all max-w-[160px]">{m.client?.name || "-"}</td>
                <td className="p-2 sm:p-3">
                  {refreshing.has(m.id) || recentlyRefreshed.has(m.id) ? (
                    <span className="inline-flex items-center gap-1 text-yellow-700 font-semibold">
                      <RefreshCw size={16} /> Refresh
                    </span>
                  ) : m.status === "active" ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                      <CheckCircle2 size={16} /> Active
                    </span>
                  ) : m.status === "refresh" ? (
                    <span className="inline-flex items-center gap-1 text-yellow-700 font-semibold">
                      <RefreshCw size={16} /> Refresh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                      <AlertTriangle size={16} /> Expired
                    </span>
                  )}
                </td>
                <td className="p-2 sm:p-3">
                  <button
                    onClick={() => refreshMailbox(m.id)}
                    className="inline-flex items-center gap-2 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 text-xs sm:text-sm"
                    disabled={refreshing.has(m.id)}
                    title="Refresh token"
                    aria-label="Refresh mailbox token"
                  >
                    <RefreshCw size={16} /> Refresh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        </div>
      </div>
    </div>
  );
}
