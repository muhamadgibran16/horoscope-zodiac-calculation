import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    port: parseInt(process.env.APP_PORT ?? '3100', 10),
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/horoscope',
        port: parseInt(process.env.MONGODB_PORT ?? '27017', 10),
        host: process.env.MONGODB_HOST || 'localhost',
        database: process.env.MONGODB_DATABASE || 'horoscope',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'youapp-secret-key',
        expiration: process.env.JWT_EXPIRATION || '24h',
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
        host: process.env.RABBITMQ_HOST || 'localhost',
        username: process.env.RABBITMQ_USERNAME || 'guest',
        password: process.env.RABBITMQ_PASSWORD || 'guest',
        chatExchange: process.env.RABBITMQ_CHAT_EXCHANGE || 'chat',
        chatQueue: process.env.RABBITMQ_CHAT_QUEUE || 'chat',
        portManagement: parseInt(process.env.RABBITMQ_PORT_MANAGEMENT ?? '15672', 10),
    },
}));
