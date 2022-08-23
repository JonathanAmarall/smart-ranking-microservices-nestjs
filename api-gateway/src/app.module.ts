import { JogadoresModule } from './jogadores/jogadores.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoriasModule } from './categorias/categorias.module';
import { ClientProxySmartRanking } from './proxyrmq/client-proxy';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';
import { AwsModule } from './aws/aws.module';
import { DesafiosModule } from './desafios/desafios.module';
import { RankingsModule } from './rankings/rankings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CategoriasModule,
    JogadoresModule,
    DesafiosModule,
    RankingsModule,
    ProxyRMQModule,
    AwsModule,
  ],
  controllers: [],
  providers: [ClientProxySmartRanking],
})
export class AppModule {}
