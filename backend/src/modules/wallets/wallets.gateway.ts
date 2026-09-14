import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'wallets',
})
export class WalletsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userConnections: Map<string, Socket[]> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId).push(client);

    console.log(`User ${userId} connected to wallets namespace`);
    client.join(`user_${userId}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (this.userConnections.has(userId)) {
      const connections = this.userConnections.get(userId);
      const index = connections.indexOf(client);
      if (index > -1) {
        connections.splice(index, 1);
      }
    }

    console.log(`User ${userId} disconnected from wallets namespace`);
  }

  broadcastWalletCreated(userId: string, wallet: any) {
    this.server.to(`user_${userId}`).emit('wallet-created', {
      action: 'created',
      wallet,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWalletUpdated(userId: string, wallet: any) {
    this.server.to(`user_${userId}`).emit('wallet-updated', {
      action: 'updated',
      wallet,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWalletDeleted(userId: string, walletId: string) {
    this.server.to(`user_${userId}`).emit('wallet-deleted', {
      action: 'deleted',
      walletId,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWalletRestored(userId: string, wallet: any) {
    this.server.to(`user_${userId}`).emit('wallet-restored', {
      action: 'restored',
      wallet,
      timestamp: new Date().toISOString(),
    });
  }
}
