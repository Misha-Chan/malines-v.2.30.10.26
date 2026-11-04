import type { WebSocket } from 'ws';

const clients = new Set<WebSocket>();

export function addClient(socket: WebSocket): void {
  clients.add(socket);
}

export function removeClient(socket: WebSocket): void {
  clients.delete(socket);
}

export function clientCount(): number {
  return clients.size;
}

/** Push an event to every connected client. Safe to call with no clients. */
export function broadcast(type: string, payload?: unknown): void {
  const message = JSON.stringify({ type, at: Date.now(), payload });
  for (const socket of clients) {
    try {
      socket.send(message);
    } catch {
      clients.delete(socket);
    }
  }
}
