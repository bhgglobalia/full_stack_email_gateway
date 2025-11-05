"use client";
import { useEffect } from "react";
import { socket } from "@/lib/socket";

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log(" Connected to WebSocket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log(" Disconnected from WebSocket");
    });

    if (onEvent) {
      socket.onAny((event, data) => onEvent(event, data));
    }

    return () => {
      socket.disconnect();
    };
  }, [onEvent]);
};
