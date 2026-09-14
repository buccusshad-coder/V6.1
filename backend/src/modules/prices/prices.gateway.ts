import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PricesService } from './prices.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'prices',
})
export class PricesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private pricesService: PricesService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-symbol')
  async subscribeToSymbol(client: Socket, symbol: string) {
    console.log(`${client.id} subscribed to ${symbol}`);
    client.join(`symbol-${symbol}`);

    const price = await this.pricesService.getLatestPrice(symbol);
    client.emit('price-update', { symbol, ...price });
  }

  @SubscribeMessage('unsubscribe-symbol')
  unsubscribeFromSymbol(client: Socket, symbol: string) {
    client.leave(`symbol-${symbol}`);
    console.log(`${client.id} unsubscribed from ${symbol}`);
  }

  // Emit price updates to all subscribers
  broadcastPriceUpdate(symbol: string, priceData: any) {
    this.server.to(`symbol-${symbol}`).emit('price-update', {
      symbol,
      ...priceData,
      timestamp: new Date().toISOString(),
    });
  }
}
