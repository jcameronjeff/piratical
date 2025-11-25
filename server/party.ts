import type * as Party from "partykit/server";

export default class GameRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    // First player is host
    const isHost = [...this.room.getConnections()].length === 1;
    
    conn.send(JSON.stringify({
      type: 'init',
      playerId: conn.id,
      isHost
    }));

    // Notify others
    this.room.broadcast(JSON.stringify({
      type: 'join',
      playerId: conn.id
    }), [conn.id]);
  }

  onMessage(message: string, sender: Party.Connection) {
    // Parse and enrich message with sender info
    const data = JSON.parse(message);
    
    // Broadcast input to all players with frame number and playerId
    this.room.broadcast(JSON.stringify({
      ...data,
      playerId: sender.id,
      timestamp: Date.now()
    }));
  }

  onClose(conn: Party.Connection) {
    this.room.broadcast(JSON.stringify({
      type: 'leave',
      playerId: conn.id
    }));
  }
}

// Make sure to explicitly implement the interface
GameRoom satisfies Party.Worker;
