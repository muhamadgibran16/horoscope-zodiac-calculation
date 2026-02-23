import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service.js';

// Mock amqplib
jest.mock('amqplib', () => ({
    connect: jest.fn(),
}));

import * as amqplib from 'amqplib';

describe('RabbitMQService', () => {
    let service: RabbitMQService;
    let mockConfigService: any;
    let mockChannel: any;
    let mockConnection: any;

    beforeEach(async () => {
        mockChannel = {
            assertExchange: jest.fn().mockResolvedValue({}),
            assertQueue: jest.fn().mockResolvedValue({}),
            bindQueue: jest.fn().mockResolvedValue({}),
            prefetch: jest.fn().mockResolvedValue({}),
            publish: jest.fn().mockReturnValue(true),
            consume: jest.fn().mockResolvedValue({}),
            ack: jest.fn(),
            nack: jest.fn(),
            close: jest.fn().mockResolvedValue({}),
        };

        mockConnection = {
            createChannel: jest.fn().mockResolvedValue(mockChannel),
            on: jest.fn(),
            close: jest.fn().mockResolvedValue({}),
        };

        (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

        mockConfigService = {
            get: jest.fn().mockReturnValue('amqp://guest:guest@localhost:5672'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RabbitMQService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<RabbitMQService>(RabbitMQService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onModuleInit', () => {
        it('should connect to RabbitMQ on init', async () => {
            await service.onModuleInit();

            expect(amqplib.connect).toHaveBeenCalled();
            expect(mockConnection.createChannel).toHaveBeenCalled();
            expect(mockChannel.assertExchange).toHaveBeenCalledWith(
                'chat_exchange',
                'direct',
                { durable: true },
            );
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('chat_messages', {
                durable: true,
            });
        });
    });

    describe('publishMessage', () => {
        it('should publish a message to RabbitMQ', async () => {
            await service.onModuleInit();

            const payload = {
                senderId: '1',
                receiverId: '2',
                content: 'Hello!',
                messageId: '3',
                timestamp: new Date().toISOString(),
            };

            const result = await service.publishMessage(payload);

            expect(result).toBe(true);
            expect(mockChannel.publish).toHaveBeenCalledWith(
                'chat_exchange',
                'chat',
                expect.any(Buffer),
                { persistent: true, contentType: 'application/json' },
            );
        });

        it('should return false if channel is not available', async () => {
            const payload = {
                senderId: '1',
                receiverId: '2',
                content: 'Hello!',
                messageId: '3',
                timestamp: new Date().toISOString(),
            };

            const result = await service.publishMessage(payload);

            expect(result).toBe(false);
        });
    });

    describe('isConnected', () => {
        it('should return false when not connected', () => {
            expect(service.isConnected()).toBe(false);
        });

        it('should return true when connected', async () => {
            await service.onModuleInit();
            expect(service.isConnected()).toBe(true);
        });
    });
});
