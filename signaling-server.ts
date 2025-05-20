import { randomBytes } from "crypto";
import { MessageType, type Message } from "./types.ts";
const peerIds: string[] = [];

const signalingServer = Bun.serve({
  port: 3000,
  fetch(req, server) {

    if (server.upgrade(req)) {
      return;
    }
    return new Response("Not a WebSocket request", { status: 400 });
  },
  websocket: {
    message(_, message) {
      const socketMessage = JSON.parse(message as string) as Message<any>;
      console.log("Received message:", socketMessage);
    },
    open(ws) {
      const peerId = randomBytes(20).toString("hex");
      peerIds.push(peerId);
      ws.send(JSON.stringify({
        type: MessageType.PEER_ID_INIT,
        data: { peerId }
      }));
      console.log("Active Peers: ", peerIds);
    },
    close(_, code, message) {
      console.log("Peer disconnected with code:", code, "and message:", message);
    },
    drain(_) {
      console.log("Socket ready to receive more data");
    },
  },
});

console.log(`Running signaling server on port ${signalingServer.port}`);
