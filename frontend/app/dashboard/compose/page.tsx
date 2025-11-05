"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { FiMail } from "react-icons/fi";

export default function ComposePage() {
  const [from, setFrom] = useState("");
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/mailboxes");
        setMailboxes(
          Array.isArray(res.data.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch {
        setMailboxes([]);
      }
    })();
  }, []);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (attachment) {
        const formData = new FormData();
        formData.append("mailboxId", from);
        formData.append("to", to);
        formData.append("subject", subject);
        formData.append("message", message);
        formData.append("attachment", attachment);
        await api.post("/mail/send", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/mail/send", {
          mailboxId: from,
          to,
          subject,
          message,
        });
      }

      toast.success(" Email sent successfully!");
 
      setFrom("");
      setTo("");
      setSubject("");
      setMessage("");
      setAttachment(null);
    } catch (err) {
      console.error(err);
      toast.error(" Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-md rounded-2xl p-8 sm:p-10 border border-gray-100">
      
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <FiMail className="text-blue-600 text-3xl" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Compose New Email
        </h1>
      </div>

   
      <form onSubmit={handleSend} className="space-y-6">
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">From</label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select mailbox</option>
            {mailboxes.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.email}
              </option>
            ))}
          </select>
        </div>

    
        <div>
          <label className="block text-gray-700 font-medium mb-2">To</label>
          <input
            type="email"
            placeholder="recipient@domain.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

 
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Subject
          </label>
          <input
            type="text"
            placeholder="Subject line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Message
          </label>
          <textarea
            rows={8}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

       
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Attachment (optional)
          </label>
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="w-full text-gray-900"
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-8">
          <button
            type="reset"
            onClick={() => {
              setFrom("");
              setTo("");
              setSubject("");
              setMessage("");
              setAttachment(null);
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-semibold border border-gray-300 transition-all"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md disabled:opacity-60 transition-all"
          >
            {loading ? "Sending..." : "Send Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
