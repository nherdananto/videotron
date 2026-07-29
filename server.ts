import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./src/server/socketHandlers.js";
import { setIO } from "./src/server/ioSingleton.js";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/socket.io",
  });
  setIO(io);
  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Interactive Videotron ready on http://localhost:${port}`);
  });
});
