"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUnreadLogsStore } from "@/store/unreadLogs";
import io from "socket.io-client";


let socket: ReturnType<typeof io> | null = null;

export function LogNotificationProvider({ children }: { children: React.ReactNode }) {
  const incrementUnread = useUnreadLogsStore((s) => s.increment);
  const pathname = usePathname();

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000");
    }

    const seenEventIds = new Set<number>();
    const handler = (event: any) => {
      if (pathname !== "/dashboard/logs" && event && event.id && !seenEventIds.has(event.id)) {
        seenEventIds.add(event.id);
        incrementUnread();
      }
    };
    socket.on("email_event", handler);
    return () => {
      socket?.off("email_event", handler);
    };
  }, [pathname, incrementUnread]);

  return <>{children}</>;
}
