import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets/interfaces';
import { Server, Socket } from 'socket.io';
import { MessageWsService } from './message-ws.service';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interface';

@WebSocketGateway({ cors: true })
export class MessageWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messageWsService: MessageWsService,
    private readonly jwtService: JwtService,
  ) {}
  public async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
      await this.messageWsService.registerClient(client, payload.id);
    } catch (error) {
      client.disconnect();
      return;
    }

    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnecteClients(),
    );
  }
  public handleDisconnect(client: Socket) {
    this.messageWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messageWsService.getConnecteClients(),
    );
  }
  @SubscribeMessage('message-from-client')
  public handleMessageFromClient(client: Socket, payload: NewMessageDto) {
    // Emite únicamente al cliente inicial
    // client.emit('message-from-server', {
    //   fullName: 'soy yo',
    //   message: payload.message || 'no message',
    // });
    // Emitir a todos menos al cliente inicial
    this.wss.emit('message-from-server', {
      fullName: this.messageWsService.getUSerFullName(client.id),
      message: payload.message || 'no message',
    });
    // this.wss.emit('message-from-server', {
    //   fullName: 'soy yo',
    //   message: payload.message || 'no message',
    // });
  }
}
