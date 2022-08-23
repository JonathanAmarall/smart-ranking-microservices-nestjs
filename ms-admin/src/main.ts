import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

import * as momentTimezone from 'moment-timezone';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://localhost:5672`],
      noAck: false, // só irá remover da fila após receber confirmação de que foi recebido
      queue: 'admin-backend',
    },
  });

  Date.prototype.toJSON = function (): any {
    return momentTimezone(this)
      .tz('America/Sao_Paulo')
      .format('YYYY-MM-DD HH:mm:ss.SSS');
  };

  //await app.listen(() => logger.log('Microservice ms-admin is listening.'));
  await app.listen();
}

bootstrap();
