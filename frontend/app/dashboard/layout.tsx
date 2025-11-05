
"use client";
import { useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import Navbar from "@/components/common/Navbar";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-blue-700 text-white transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:static sm:block`}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

  
      <div className="flex flex-col flex-1 w-full min-w-0">
    
        <div className="flex items-center justify-between bg-white shadow-sm p-4 sm:p-5 sticky top-0 z-40">
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 rounded-md hover:bg-gray-100 text-gray-700"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Navbar />
        </div>

        
        <main className="flex-1 p-2 sm:p-6 overflow-y-auto min-w-0 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
