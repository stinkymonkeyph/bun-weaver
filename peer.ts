import { type Message, MessageType } from './types.ts';
import * as fs from 'fs';
import * as path from 'path';

export class Peer {
  socket: WebSocket;
  private peerId: string | null;
  peerList: string[];

  constructor(signalingServerUrl: string) {
    console.log("Attempting to connect to ", signalingServerUrl);
    this.socket = new WebSocket(signalingServerUrl);
    this.peerId = null;
    this.peerList = [];
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.addEventListener(
        "open",
        () => {
          console.log("WebSocket connection opened");
          this.send(
            {
              type: MessageType.PEER_ESTABLISH_HANDSHAKE,
              data: {}
            }
          );

          const messageHandler = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            if (message.type === MessageType.PEER_ID_INIT) {
              this.setPeerId(message.data.peerId);
              console.log("Peer ID initialized:", this.peerId);
              if (this.peerId) {
                this.createPeerFolder(this.peerId);
              }
              resolve();
            }
          };

          this.socket.addEventListener("message", messageHandler);
        },
        { once: true },
      );

      this.socket.addEventListener(
        "error",
        (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        },
        { once: true },
      );

      this.socket.addEventListener(
        "close",
        () => {
          console.error("WebSocket closed before initialization");
          reject(new Error("WebSocket closed before initialization"));
        },
        { once: true },
      );
    });
  }

  public send<T>(message: Message<T>): void {
    this.socket.send(JSON.stringify(message));
  }

  private setPeerId(peerId: string) {
    this.peerId = peerId;
  }

  public getPeerId(): string | null {
    return this.peerId;
  }

  private createPeerFolder(peerId: string): void {
    try {
      const folderPath = path.join(process.cwd(), `store-${peerId}`);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        console.log(`Created folder for peer: ${folderPath}`);
      } else {
        console.log(`Folder for peer already exists: ${folderPath}`);
      }
    } catch (error) {
      console.error(`Error creating folder for peer ${peerId}:`, error);
    }
  }
}



