// "use client";
// import { useEffect } from "react";
// import { socket } from "@/lib/socket";

// let listenerCount = 0;

// export const useSocket = (onEvent?: (event: string, data: any) => void) => {
//   useEffect(() => {

//     if (!socket.connected) {
//       socket.connect();
//       console.log("🔌 Connected to WebSocket:", socket.id);
//     }

//     listenerCount++;

//     socket.on("disconnect", () => {
//       console.log(" Disconnected from WebSocket");
//     });

//     if (onEvent) {
//       socket.onAny((event, data) => onEvent(event, data));
//     }

//     return () => {
//       listenerCount--;

//       if (onEvent) {
//         socket.offAny(onEvent);
//       }

//       // Only disconnect if no other listeners are active
//       if (listenerCount <= 0) {
//         socket.disconnect();
//         console.log("socket fully disconnected");
//       }
//     };
//   }, [onEvent]);
// };




"use client";
import { useEffect } from "react";
import { socket } from "@/lib/socket";

let socketUsers = 0; 

export const useSocket = (onEvent?: (event: string, data: unknown) => void) => {
  useEffect(() => {
    socketUsers += 1;

    if (!socket.connected) {
      socket.connect();
    }
    const handleConnect = () => {
      console.log("Connected to WebSocket:", socket.id);
    };
    const handleDisconnect = () => {
      console.log("Disconnected from WebSocket");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (onEvent) {
      socket.onAny(onEvent);
    }

    return () => {
      socketUsers -= 1;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      if (onEvent) {
        socket.offAny(onEvent);
      }

      if (socketUsers <= 0) {
        socket.disconnect();
        console.log("🧹 Socket fully disconnected (no active listeners)");
      }
    };
  }, [onEvent]);
};
