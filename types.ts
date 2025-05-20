export type Message<T> = {
  type: string;
  data: T;
}

export const MessageType = {
  PEER_ESTABLISH_HANDSHAKE: 'peer-establish-handshake',
  PEER_ID_INIT: 'peer-id-init',
  PEER_ID_ACKNOWLEDGE: 'peer-id-acknowledge'
}
