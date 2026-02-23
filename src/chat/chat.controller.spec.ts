import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

describe('ChatController', () => {
    let controller: ChatController;
    let mockChatService: any;

    const mockUser = { _id: '507f1f77bcf86cd799439011' };

    beforeEach(async () => {
        mockChatService = {
            sendMessage: jest.fn().mockResolvedValue({
                _id: '507f1f77bcf86cd799439033',
                content: 'Hello!',
            }),
            viewMessages: jest.fn().mockResolvedValue({
                messages: [],
                total: 0,
                page: 1,
                limit: 50,
                totalPages: 0,
            }),
            getChatRooms: jest.fn().mockResolvedValue([]),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChatController],
            providers: [{ provide: ChatService, useValue: mockChatService }],
        }).compile();

        controller = module.get<ChatController>(ChatController);
    });

    describe('sendMessage', () => {
        it('should send a message', async () => {
            const dto = {
                receiverId: '507f1f77bcf86cd799439022',
                content: 'Hello!',
            };

            const result = await controller.sendMessage(mockUser, dto);

            expect(result).toHaveProperty('content', 'Hello!');
            expect(mockChatService.sendMessage).toHaveBeenCalledWith(
                mockUser._id,
                dto,
            );
        });
    });

    describe('viewMessages', () => {
        it('should return paginated messages', async () => {
            const query = {
                userId: '507f1f77bcf86cd799439022',
                page: 1,
                limit: 50,
            };

            const result = await controller.viewMessages(mockUser, query);

            expect(result).toHaveProperty('messages');
            expect(result).toHaveProperty('total');
            expect(mockChatService.viewMessages).toHaveBeenCalledWith(
                mockUser._id,
                query,
            );
        });
    });

    describe('getChatRooms', () => {
        it('should return chat rooms', async () => {
            const result = await controller.getChatRooms(mockUser);

            expect(result).toEqual([]);
            expect(mockChatService.getChatRooms).toHaveBeenCalledWith(mockUser._id);
        });
    });
});
