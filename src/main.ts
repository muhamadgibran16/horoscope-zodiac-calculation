import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module.js';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('NestApplication');

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global interceptors
  app.useGlobalInterceptors(new LoggerInterceptor());

  // Static file serving for uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('YouApp API')
    .setDescription(
      'YouApp Backend API — Login, Profile (with Horoscope & Zodiac), and Chat with RabbitMQ + Socket.IO',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'User registration and authentication')
    .addTag('Profile', 'User profile management with auto-calculated horoscope and zodiac')
    .addTag('Chat', 'Real-time messaging with RabbitMQ and Socket.IO')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port =  3111 //configService.get<number>('app.port')!;
  await app
    .listen(port)
    .then(() => {
      logger.log(`Server running at http://localhost:${port}`);
      logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
    })
    .catch((error) => {
      logger.error('Error starting server.');
      logger.error(error);
    });
}
bootstrap();
