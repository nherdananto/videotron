"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ClientRole, ServerToClientEvents } from "@/types/socket";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(campaignId: string, role: ClientRole) {
  const socketRef = useRef<AppSocket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io({ path: "/socket.io" });
  }

  useEffect(() => {
    const socket = socketRef.current!;
    socket.on("connect", () => {
      socket.emit("room:join", { campaignId, role });
    });
    if (socket.connected) {
      socket.emit("room:join", { campaignId, role });
    }
    return () => {
      socket.off("connect");
    };
  }, [campaignId, role]);

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      socket?.disconnect();
    };
  }, []);

  return socketRef.current;
}
