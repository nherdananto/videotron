import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../types/socket.js";

type AppIO = Server<ClientToServerEvents, ServerToClientEvents>;

let ioInstance: AppIO | null = null;

export function setIO(io: AppIO) {
  ioInstance = io;
}

/** Lets API routes (running in the same Node process as the custom server) push realtime events. */
export function getIO(): AppIO {
  if (!ioInstance) {
    throw new Error("Socket.io server has not been initialized yet");
  }
  return ioInstance;
}
