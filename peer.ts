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
      // Ensure the main store directory exists
      const storeDir = path.join(process.cwd(), 'store');
      if (!fs.existsSync(storeDir)) {
        fs.mkdirSync(storeDir);
        console.log(`Created main store directory: ${storeDir}`);
      }

      // Create peer-specific directory inside the store directory
      const peerDir = path.join(storeDir, peerId);
      if (!fs.existsSync(peerDir)) {
        fs.mkdirSync(peerDir);
        console.log(`Created peer directory: ${peerDir}`);
      } else {
        console.log(`Peer directory already exists: ${peerDir}`);
      }

      // Create state directory inside the peer folder
      const stateDirPath = path.join(peerDir, 'state');
      if (!fs.existsSync(stateDirPath)) {
        fs.mkdirSync(stateDirPath);
        console.log(`Created state directory: ${stateDirPath}`);
      } else {
        console.log(`State directory already exists: ${stateDirPath}`);
      }

      // Create state.json file with default values
      const stateFilePath = path.join(stateDirPath, 'state.json');
      const defaultStateContent = JSON.stringify({
        current_hash: "",
        target_hash: ""
      }, null, 2);

      if (!fs.existsSync(stateFilePath)) {
        fs.writeFileSync(stateFilePath, defaultStateContent);
        console.log(`Created state.json file with default values: ${stateFilePath}`);
      } else {
        console.log(`State.json file already exists: ${stateFilePath}`);
      }
    } catch (error) {
      console.error(`Error setting up folder structure for peer ${peerId}:`, error);
    }
  }
}



