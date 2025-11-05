

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Clock, MailPlus, PlusCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ clients: 0, mailboxes: 0, lastEvent: "—" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resClients = await api.get("/clients");
        const clients = Array.isArray(resClients.data.data) ? resClients.data.data : [];
        const resActiveMailboxes = await api.get("/mailboxes/active/count");
        const resEvents = await api.get("/events?limit=1");
        let lastEvent = "—";
        if (Array.isArray(resEvents.data.data) && resEvents.data.data.length > 0) {
          const ev = resEvents.data.data[0];
          lastEvent = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—";
        }
        setStats({
          clients: clients.length,
          mailboxes: resActiveMailboxes.data.count || 0,
          lastEvent,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full max-w-screen-xl mx-auto text-gray-900">
    
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-center sm:text-left">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Stat title="Total Clients" value={stats.clients} icon={<Users className="text-blue-600" />} />
        <Stat title="Active Mailboxes" value={stats.mailboxes} icon={<Mail className="text-green-600" />} />
        <Stat title="Last Event" value={stats.lastEvent} icon={<Clock className="text-gray-600" />} />
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center sm:text-left">
          Quick Actions
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
          <button
            onClick={() => router.push("/dashboard/mailboxes?provider=gmail")}
            aria-label="Connect Gmail"
            className="flex justify-center items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition w-full sm:w-auto"
          >
            <MailPlus className="w-4 h-4" /> Connect Gmail
          </button>
          <button
            onClick={() => router.push("/dashboard/mailboxes?provider=outlook")}
            aria-label="Connect Outlook"
            className="flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4" /> Connect Outlook
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className="text-xl sm:text-2xl font-semibold">{value}</h3>
      </div>
      <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
    </div>
  );
}