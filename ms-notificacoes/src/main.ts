import { Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://localhost:5672`],
      noAck: false,
      queue: 'notificacoes',
    },
  });
  await app.listen();
}
bootstrap();
