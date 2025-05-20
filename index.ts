import { Peer } from "./peer.ts"


const peer = new Peer("ws://localhost:3000");
await peer.initialize();
const peerId = peer.getPeerId();
peer.send<{ peerId: string | null }>({
  type: "peer-id-acknowledge",
  data: {
    peerId
  }
})

