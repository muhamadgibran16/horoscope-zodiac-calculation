import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema.js';
import { ChatRoom, ChatRoomDocument } from './schemas/chat-room.schema.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ViewMessagesDto } from './dto/view-messages.dto.js';
import { RabbitMQService, ChatMessagePayload } from './services/rabbitmq.service.js';
import { ChatGateway } from './gateways/chat.gateway.js';

export interface PaginatedMessages {
    messages: MessageDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class ChatService implements OnModuleInit {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        @InjectModel(Message.name)
        private readonly messageModel: Model<MessageDocument>,
        @InjectModel(ChatRoom.name)
        private readonly chatRoomModel: Model<ChatRoomDocument>,
        private readonly rabbitMQService: RabbitMQService,
        private readonly chatGateway: ChatGateway,
    ) { }

    async onModuleInit() {
        // Start consuming RabbitMQ messages and forward via Socket.IO
        await this.rabbitMQService.startConsuming((payload: ChatMessagePayload) => {
            this.chatGateway.notifyNewMessage(payload);
            this.logger.debug(
                `Forwarded message from RabbitMQ to Socket.IO for user ${payload.receiverId}`,
            );
        });
    }

    async sendMessage(
        senderId: string,
        sendMessageDto: SendMessageDto,
    ): Promise<MessageDocument> {
        const { receiverId, content } = sendMessageDto;

        // Create message in database
        const message = await this.messageModel.create({
            senderId: new Types.ObjectId(senderId),
            receiverId: new Types.ObjectId(receiverId),
            content,
        });

        // Upsert chat room (sorted participant IDs for consistent lookup)
        const participants = [senderId, receiverId]
            .sort()
            .map((id) => new Types.ObjectId(id));

        await this.chatRoomModel.findOneAndUpdate(
            { participants },
            {
                $set: {
                    participants,
                    lastMessage: message._id,
                },
                $inc: { unreadCount: 1 },
            },
            { upsert: true, new: true },
        );

        // Publish to RabbitMQ for real-time notification
        const payload: ChatMessagePayload = {
            senderId,
            receiverId,
            content,
            messageId: (message._id as Types.ObjectId).toString(),
            timestamp: new Date().toISOString(),
        };

        await this.rabbitMQService.publishMessage(payload);

        return message;
    }

    async viewMessages(
        currentUserId: string,
        viewMessagesDto: ViewMessagesDto,
    ): Promise<PaginatedMessages> {
        const { userId: otherUserId, page = 1, limit = 50 } = viewMessagesDto;
        const skip = (page - 1) * limit;

        const currentUser = new Types.ObjectId(currentUserId);
        const otherUser = new Types.ObjectId(otherUserId);

        // Query messages between the two users (bidirectional)
        const query = {
            $or: [
                { senderId: currentUser, receiverId: otherUser },
                { senderId: otherUser, receiverId: currentUser },
            ],
        };

        const [messages, total] = await Promise.all([
            this.messageModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('senderId', 'username email')
                .populate('receiverId', 'username email'),
            this.messageModel.countDocuments(query),
        ]);

        // Mark messages from the other user as read
        await this.messageModel.updateMany(
            {
                senderId: otherUser,
                receiverId: currentUser,
                read: false,
            },
            { $set: { read: true } },
        );

        // Reset unread count in chat room
        const participants = [currentUserId, otherUserId]
            .sort()
            .map((id) => new Types.ObjectId(id));

        await this.chatRoomModel.findOneAndUpdate(
            { participants },
            { $set: { unreadCount: 0 } },
        );

        return {
            messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getChatRooms(userId: string): Promise<ChatRoomDocument[]> {
        return this.chatRoomModel
            .find({
                participants: new Types.ObjectId(userId),
            })
            .populate('participants', 'username email')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });
    }

    async markAsRead(
        currentUserId: string,
        senderId: string,
    ): Promise<number> {
        const result = await this.messageModel.updateMany(
            {
                senderId: new Types.ObjectId(senderId),
                receiverId: new Types.ObjectId(currentUserId),
                read: false,
            },
            { $set: { read: true } },
        );

        return result.modifiedCount;
    }
}
