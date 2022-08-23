import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriasModule } from './categorias/categorias.module';
import { CategoriaSchema } from './categorias/interfaces/categoria.schema';
import { CategoriasService } from './categorias/services/categorias.service';
import { JogadorSchema } from './jogadores/interfaces/jogador.schema';
import { JogadoresModule } from './jogadores/jogadores.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:mongopw@localhost:27017/', {
      useNewUrlParser: true,
    }),
    MongooseModule.forFeature([
      { name: 'Categoria', schema: CategoriaSchema },
      { name: 'Jogador', schema: JogadorSchema },
    ]),
    CategoriasModule,
    JogadoresModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [CategoriasService],
})
export class AppModule {}
