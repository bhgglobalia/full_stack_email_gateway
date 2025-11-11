"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUnreadLogsStore } from "@/store/unreadLogs";
import { socket } from "@/lib/socket";
 
 
export function LogNotificationProvider({ children }: { children: React.ReactNode }) {
  const incrementUnread = useUnreadLogsStore((s) => s.increment);
  const pathname = usePathname();
 
  useEffect(() => {
 
    const seenEventIds = new Set<number>();
    const handler = (event: { id: number | string }) => {
      const eventId = Number(event.id);
      if (
        pathname !== "/dashboard/logs" &&
        event &&
        event.id &&
        !seenEventIds.has(eventId)
      ) {
        seenEventIds.add(eventId);
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
 