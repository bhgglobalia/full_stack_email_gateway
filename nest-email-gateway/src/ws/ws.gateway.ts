import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';


@WebSocketGateway({ cors: { origin: process.env.FRONTEND_ORIGIN || '*' } })
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
@WebSocketServer()
server: Server;


private logger = new Logger('WsGateway');
private redisSub: Redis;
private redisPub: Redis;
private readonly REDIS_CHANNEL = 'ws-events';


afterInit(server: Server) {
  this.logger.log('ws init');
}

async onModuleInit() {
  this.redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  this.redisPub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  await this.redisSub.subscribe(this.REDIS_CHANNEL);
  this.redisSub.on('message', (channel, message) => {
    if (channel === this.REDIS_CHANNEL) {
      try {
        const { event, payload } = JSON.parse(message);
        this.emit(event, payload, true);
      } catch (e) {
        this.logger.error('Failed to parse Redis pubsub message', e);
      }
    }
  });
  this.logger.log('Redis pub/sub connected for WebSocket events');
}

async onModuleDestroy() {
  await this.redisSub.quit();
  await this.redisPub.quit();
}


handleConnection(client: Socket) {
this.logger.log(`client connected: ${client.id}`);
}


handleDisconnect(client: Socket) {
this.logger.log(`client disconnected: ${client.id}`);
}


emit(event: string, payload: any, fromRedis = false) {

  this.server.emit(event, payload);

  if (!fromRedis && this.redisPub) {
    this.redisPub.publish(this.REDIS_CHANNEL, JSON.stringify({ event, payload }));
  }
}
}