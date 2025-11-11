"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Clock, MailPlus, PlusCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { api } from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ clients: 0, mailboxes: 0, lastEvent: "—" });
  const [loading, setLoading] = useState(true);
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
      } catch  {
        toast.error("Error fetching stats", { id: "fetch-stats" });
      }finally{
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto text-gray-900 px-3 sm:px-6 md:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center sm:text-left">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-600 text-center sm:text-left">Key stats and quick actions for your email gateway</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
        <StatCard title="Total Clients" value={stats.clients} icon={<Users className="text-blue-600" />} />
        <StatCard title="Active Mailboxes" value={stats.mailboxes} icon={<Mail className="text-green-600" />} />
        <StatCard title="Last Event" value={stats.lastEvent} icon={<Clock className="text-gray-600" />} />
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-center sm:text-left">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:justify-start">
          <button
            onClick={() => router.push("/dashboard/mailboxes?provider=gmail")}
            aria-label="Connect Gmail"
            className="flex justify-center items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 active:scale-[0.99] transition shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <MailPlus className="w-4 h-4" /> Connect Gmail
          </button>
          <button
            onClick={() => router.push("/dashboard/mailboxes?provider=outlook")}
            aria-label="Connect Outlook"
            className="flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:scale-[0.99] transition shadow-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <PlusCircle className="w-4 h-4" /> Connect Outlook
          </button>
        </div>
      </div>
    </div>
  );
}
