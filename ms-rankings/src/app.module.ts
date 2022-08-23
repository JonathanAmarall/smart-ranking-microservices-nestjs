import { Module } from '@nestjs/common';
import { RankingsModule } from './rankings/rankings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';

@Module({
  imports: [
    RankingsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://admin:mongopw@localhost:27017/', {
      useNewUrlParser: true,
    }),
    ProxyRMQModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
