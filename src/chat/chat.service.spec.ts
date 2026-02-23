import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service.js';
import { Message } from './schemas/message.schema.js';
import { ChatRoom } from './schemas/chat-room.schema.js';
import { RabbitMQService } from './services/rabbitmq.service.js';
import { ChatGateway } from './gateways/chat.gateway.js';

describe('ChatService', () => {
    let service: ChatService;
    let mockMessageModel: any;
    let mockChatRoomModel: any;
    let mockRabbitMQService: any;
    let mockChatGateway: any;

    beforeEach(async () => {
        mockMessageModel = {
            create: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn(),
            updateMany: jest.fn(),
        };

        mockChatRoomModel = {
            findOneAndUpdate: jest.fn(),
            find: jest.fn(),
        };

        mockRabbitMQService = {
            publishMessage: jest.fn().mockResolvedValue(true),
            startConsuming: jest.fn(),
        };

        mockChatGateway = {
            notifyNewMessage: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                { provide: getModelToken(Message.name), useValue: mockMessageModel },
                { provide: getModelToken(ChatRoom.name), useValue: mockChatRoomModel },
                { provide: RabbitMQService, useValue: mockRabbitMQService },
                { provide: ChatGateway, useValue: mockChatGateway },
            ],
        }).compile();

        service = module.get<ChatService>(ChatService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        it('should create message, upsert chat room, and publish to RabbitMQ', async () => {
            const mockMessage = {
                _id: '507f1f77bcf86cd799439033',
                senderId: '507f1f77bcf86cd799439011',
                receiverId: '507f1f77bcf86cd799439022',
                content: 'Hello!',
            };

            mockMessageModel.create.mockResolvedValue(mockMessage);
            mockChatRoomModel.findOneAndUpdate.mockResolvedValue({});

            const result = await service.sendMessage('507f1f77bcf86cd799439011', {
                receiverId: '507f1f77bcf86cd799439022',
                content: 'Hello!',
            });

            expect(result).toEqual(mockMessage);
            expect(mockMessageModel.create).toHaveBeenCalled();
            expect(mockChatRoomModel.findOneAndUpdate).toHaveBeenCalled();
            expect(mockRabbitMQService.publishMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    senderId: '507f1f77bcf86cd799439011',
                    receiverId: '507f1f77bcf86cd799439022',
                    content: 'Hello!',
                }),
            );
        });
    });

    describe('viewMessages', () => {
        it('should return paginated messages and mark as read', async () => {
            const mockMessages = [
                { _id: '1', content: 'Hello', senderId: 'a', receiverId: 'b' },
                { _id: '2', content: 'Hi there!', senderId: 'b', receiverId: 'a' },
            ];

            const chainMock = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
            };
            // Second populate call resolves
            chainMock.populate
                .mockReturnValueOnce(chainMock)
                .mockResolvedValueOnce(mockMessages);

            mockMessageModel.find.mockReturnValue(chainMock);
            mockMessageModel.countDocuments.mockResolvedValue(2);
            mockMessageModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
            mockChatRoomModel.findOneAndUpdate.mockResolvedValue({});

            const result = await service.viewMessages('507f1f77bcf86cd799439011', {
                userId: '507f1f77bcf86cd799439022',
                page: 1,
                limit: 50,
            });

            expect(result.messages).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.page).toBe(1);
            expect(result.totalPages).toBe(1);
            expect(mockMessageModel.updateMany).toHaveBeenCalled();
        });
    });

    describe('getChatRooms', () => {
        it('should return chat rooms sorted by updatedAt', async () => {
            const mockRooms = [
                { _id: '1', participants: [], lastMessage: null },
            ];

            const chainMock = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockRooms),
            };
            // Two populate calls, then sort
            chainMock.populate
                .mockReturnValueOnce(chainMock)
                .mockReturnValueOnce(chainMock);

            mockChatRoomModel.find.mockReturnValue(chainMock);

            const result = await service.getChatRooms('507f1f77bcf86cd799439011');

            expect(result).toEqual(mockRooms);
        });
    });

    describe('markAsRead', () => {
        it('should mark messages as read', async () => {
            mockMessageModel.updateMany.mockResolvedValue({ modifiedCount: 5 });

            const count = await service.markAsRead(
                '507f1f77bcf86cd799439011',
                '507f1f77bcf86cd799439022',
            );

            expect(count).toBe(5);
        });
    });
});
