"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface SystemStatus {
  apiKeys: { id: string; name: string; key: string }[];
  webhooks: { provider: string; url: string }[];
  workers: { name: string; status: string }[];
  tokens: { mailbox: string; provider: string; expiresAt: string }[];
}

export default function SettingsPage() {
  const [maskedKeys, setMaskedKeys] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [tokenExpiry, setTokenExpiry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [keysRes, webhooksRes, workerRes, expiryRes] = await Promise.all([
          api.get("/settings/masked-keys"),
          api.get("/settings/webhooks"),
          api.get("/settings/worker-health"),
          api.get("/settings/token-expiry"),
        ]);
        setMaskedKeys(keysRes.data);
        setWebhooks(webhooksRes.data);
        setWorker(workerRes.data);
        setTokenExpiry(Array.isArray(expiryRes.data) ? expiryRes.data : []);
      } catch (err) {
        toast.error(" Failed to fetch settings info");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-gray-600 text-lg">Loading system info...</p>
      </div>
    );
  }

  if (!maskedKeys || !webhooks || !worker) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-red-600 text-lg">Failed to load settings data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto bg-white shadow-lg border border-gray-200 rounded-2xl px-2 sm:px-4 md:px-8 py-4 sm:py-8 mt-2 sm:mt-6 md:mt-10 overflow-x-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-8 border-b pb-2 sm:pb-3">
         System Settings & Monitoring
      </h1>


      <section className="mb-8 sm:mb-10">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">API Keys</h2>
        <div className="bg-gray-50 border rounded-lg divide-y">
          {Object.entries(maskedKeys).map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-4 p-2 sm:p-3 md:p-4 hover:bg-gray-100 transition-all">
              <span className="text-gray-800 font-medium break-all w-full sm:w-1/3">{k}</span>
              <span className="font-mono text-gray-600 break-all w-full sm:w-2/3 text-xs sm:text-sm md:text-base">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
            </div>
          ))}
        </div>
      </section>

      
      <section className="mb-8 sm:mb-10">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Webhook URLs</h2>
        <div className="bg-gray-50 border rounded-lg divide-y">
          {Object.entries(webhooks).map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-4 p-2 sm:p-3 md:p-4 hover:bg-gray-100 transition-all">
              <span className="text-gray-800 font-medium capitalize break-all w-full sm:w-1/3">{k}</span>
              <span className="text-blue-700 font-mono truncate break-all max-w-full sm:max-w-[60%] text-xs sm:text-sm md:text-base">{v as string}</span>
            </div>
          ))}
        </div>
      </section>


      <section className="mb-8 sm:mb-10">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Worker Health</h2>
        <div className="bg-gray-50 border rounded-lg divide-y">
          <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-4 p-2 sm:p-3 md:p-4 hover:bg-gray-100 transition-all">
            <span className="text-gray-800 font-medium">Worker</span>
            <span className={
              worker.status === 'ok'
                ? 'bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold'
                : 'bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold'
            }>
              {worker.status}
            </span>
            <span className="text-gray-600 font-mono text-xs sm:text-sm md:text-base">{new Date(worker.lastPing).toLocaleString()}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
          Token Expiry Info
        </h2>
        <div className="bg-gray-50 border rounded-lg divide-y">
          {tokenExpiry.map((t, index) => (
            <div key={index} className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-4 p-2 sm:p-3 md:p-4 hover:bg-gray-100 transition-all">
              <span className="text-gray-800 font-medium break-all w-full sm:w-1/2">
                {t.email} ({t.provider})
              </span>
              <span className="text-gray-600 font-mono break-all w-full sm:w-1/2">
                {t.tokenExpiresAt ? new Date(t.tokenExpiresAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

