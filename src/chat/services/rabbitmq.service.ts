import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

export interface ChatMessagePayload {
    senderId: string;
    receiverId: string;
    content: string;
    messageId: string;
    timestamp: string;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private connection: any = null;
    private channel: amqplib.Channel | null = null;
    private readonly logger = new Logger(RabbitMQService.name);
    private readonly exchange = 'chat_exchange';
    private readonly queue = 'chat_messages';
    private messageHandler: ((msg: ChatMessagePayload) => void) | null = null;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        await this.connect();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async connect(retries = 5): Promise<void> {
        const url = this.configService.get<string>('app.rabbitmq.url')!;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const connection = await amqplib.connect(url);
                const channel = await connection.createChannel();

                // Setup exchange and queue
                await channel.assertExchange(this.exchange, 'direct', {
                    durable: true,
                });
                await channel.assertQueue(this.queue, { durable: true });
                await channel.bindQueue(this.queue, this.exchange, 'chat');

                // Prefetch for fair dispatch
                await channel.prefetch(1);

                this.connection = connection;
                this.channel = channel;
                this.logger.log('Connected to RabbitMQ');

                // Handle connection errors
                connection.on('error', (err) => {
                    this.logger.error('RabbitMQ connection error', err);
                });

                connection.on('close', () => {
                    this.logger.warn('RabbitMQ connection closed, reconnecting...');
                    setTimeout(() => this.connect(retries), 5000);
                });

                // Start consuming if handler is registered
                if (this.messageHandler) {
                    await this.startConsuming(this.messageHandler);
                }

                return;
            } catch (error) {
                this.logger.warn(
                    `RabbitMQ connection attempt ${attempt}/${retries} failed`,
                );
                if (attempt === retries) {
                    this.logger.error(
                        'Failed to connect to RabbitMQ after all retries',
                    );
                    return;
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, 2000 * attempt),
                );
            }
        }
    }

    async publishMessage(payload: ChatMessagePayload): Promise<boolean> {
        if (!this.channel) {
            this.logger.warn(
                'RabbitMQ channel not available, message not published',
            );
            return false;
        }

        try {
            const message = Buffer.from(JSON.stringify(payload));
            this.channel.publish(this.exchange, 'chat', message, {
                persistent: true,
                contentType: 'application/json',
            });
            this.logger.debug(
                `Message published for user ${payload.receiverId}`,
            );
            return true;
        } catch (error) {
            this.logger.error('Failed to publish message', error);
            return false;
        }
    }

    async startConsuming(
        handler: (msg: ChatMessagePayload) => void,
    ): Promise<void> {
        this.messageHandler = handler;

        if (!this.channel) {
            this.logger.warn('RabbitMQ channel not available for consuming');
            return;
        }

        const channel = this.channel;

        try {
            await channel.consume(this.queue, (msg) => {
                if (msg) {
                    try {
                        const payload: ChatMessagePayload = JSON.parse(
                            msg.content.toString(),
                        );
                        handler(payload);
                        channel.ack(msg);
                    } catch (error) {
                        this.logger.error('Failed to process message', error);
                        channel.nack(msg, false, false);
                    }
                }
            });
            this.logger.log('Started consuming chat messages from RabbitMQ');
        } catch (error) {
            this.logger.error('Failed to start consuming', error);
        }
    }

    private async disconnect(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await (this.connection as any).close();
            }
            this.logger.log('Disconnected from RabbitMQ');
        } catch (error) {
            this.logger.error('Error disconnecting from RabbitMQ', error);
        }
    }

    isConnected(): boolean {
        return this.channel !== null;
    }
}
