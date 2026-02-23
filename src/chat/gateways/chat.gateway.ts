import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatMessagePayload } from '../services/rabbitmq.service.js';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    // Map of userId -> Set of socket IDs (user can have multiple connections)
    private readonly userSockets = new Map<string, Set<string>>();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} disconnected: no token`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            // Store user-socket mapping
            client.data.userId = userId;
            client.join(`user:${userId}`);

            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            this.logger.log(
                `User ${userId} connected (socket: ${client.id})`,
            );
        } catch (error) {
            this.logger.warn(`Client ${client.id} disconnected: invalid token`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(client.id);
                if (sockets.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
            this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
        }
    }

    /**
     * Notify a user about a new incoming message.
     * Emitted when RabbitMQ consumer receives a chat message.
     */
    notifyNewMessage(payload: ChatMessagePayload): void {
        this.server
            .to(`user:${payload.receiverId}`)
            .emit('newMessage', payload);
        this.logger.debug(
            `Notified user ${payload.receiverId} about new message`,
        );
    }

    /**
     * Check if a user is currently online.
     */
    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId) &&
            this.userSockets.get(userId)!.size > 0;
    }

    /**
     * Get count of online users.
     */
    getOnlineUsersCount(): number {
        return this.userSockets.size;
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string },
    ) {
        this.server
            .to(`user:${data.receiverId}`)
            .emit('userTyping', { userId: client.data.userId });
    }

    @SubscribeMessage('stopTyping')
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string },
    ) {
        this.server
            .to(`user:${data.receiverId}`)
            .emit('userStoppedTyping', { userId: client.data.userId });
    }

    @SubscribeMessage('markRead')
    handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { senderId: string },
    ) {
        this.server
            .to(`user:${data.senderId}`)
            .emit('messagesRead', { readBy: client.data.userId });
    }
}
