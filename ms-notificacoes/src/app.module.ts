import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: process.env.HOST,
        port: process.env.PORT,
        secure: false,
        tls: {
          ciphers: 'SSLv3',
        },
        auth: {
          user: process.env.USER,
          pass: process.env.PASS,
        },
      },
    }),
    ProxyRMQModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
