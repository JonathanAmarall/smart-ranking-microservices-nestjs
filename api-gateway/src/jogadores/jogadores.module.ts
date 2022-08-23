import { Module } from '@nestjs/common';
import { JogadoresController } from './jogadores.controller';
import { ProxyRMQModule } from '../proxyrmq/proxyrmq.module';
import { AwsService } from 'src/aws/aws.service';

@Module({
  imports: [ProxyRMQModule, AwsService],
  controllers: [JogadoresController],
  providers: [AwsService],
})
export class JogadoresModule {}
