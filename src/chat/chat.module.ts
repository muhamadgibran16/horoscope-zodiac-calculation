import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './gateways/chat.gateway.js';
import { RabbitMQService } from './services/rabbitmq.service.js';
import { Message, MessageSchema } from './schemas/message.schema.js';
import { ChatRoom, ChatRoomSchema } from './schemas/chat-room.schema.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: ChatRoom.name, schema: ChatRoomSchema },
        ]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('app.jwt.secret'),
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway, RabbitMQService],
    exports: [ChatService],
})
export class ChatModule { }
