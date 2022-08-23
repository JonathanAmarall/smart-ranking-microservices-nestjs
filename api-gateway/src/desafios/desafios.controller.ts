import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Get,
  Query,
  Put,
  Param,
  Delete,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CriarDesafioDto } from './dtos/criar-desafio.dto';
import { DesafioStatusValidacaoPipe } from './pipes/desafio-status-validation.pipe';
import { AtribuirDesafioPartidaDto } from './dtos/atribuir-desafio-partida.dto';
import { AtualizarDesafioDto } from './dtos/atualizar-desafio.dto';
import { ClientProxySmartRanking } from '../proxyrmq/client-proxy';
import { Jogador } from '../jogadores/interfaces/jogador.interface';
import { Desafio } from '../desafios/interfaces/desafio.interface';
import { DesafioStatus } from './desafio-status.enum';
import { Partida } from './interfaces/partida.interface';
import { firstValueFrom } from 'rxjs';

@Controller('api/v1/desafios')
export class DesafiosController {
  constructor(private clientProxySmartRanking: ClientProxySmartRanking) {}

  private readonly logger = new Logger(DesafiosController.name);

  private clientDesafios =
    this.clientProxySmartRanking.getClientProxyDesafiosInstance();

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  @Post()
  @UsePipes(ValidationPipe)
  async criarDesafio(@Body() criarDesafioDto: CriarDesafioDto) {
    this.logger.log(`criarDesafioDto: ${JSON.stringify(criarDesafioDto)}`);
    const jogadores: Jogador[] = await firstValueFrom(
      this.clientAdminBackend.send('consultar-jogadores', ''),
    );

    criarDesafioDto.jogadores.map((jogadorDto) => {
      const jogadoresFiltrados: Jogador[] = jogadores.filter(
        (jogador) => jogador._id == jogadorDto._id,
      );

      this.logger.log(`jogadorFilter: ${JSON.stringify(jogadoresFiltrados)}`);

      if (jogadoresFiltrados.length == 0) {
        throw new BadRequestException(
          `O id ${jogadorDto._id} não é um jogador!`,
        );
      }

      if (jogadoresFiltrados[0].categoria != criarDesafioDto.categoria) {
        throw new BadRequestException(
          `O jogador ${jogadoresFiltrados[0]._id} não faz parte da categoria informada!`,
        );
      }
    });

    const solicitanteEhJogadorDaPartida: Jogador[] =
      criarDesafioDto.jogadores.filter(
        (jogador) => jogador._id == criarDesafioDto.solicitante,
      );

    this.logger.log(
      `solicitanteEhJogadorDaPartida: ${JSON.stringify(
        solicitanteEhJogadorDaPartida,
      )}`,
    );

    if (solicitanteEhJogadorDaPartida.length == 0) {
      throw new BadRequestException(
        `O solicitante deve ser um jogador da partida!`,
      );
    }

    const categoria = await this.clientAdminBackend.send(
      'consultar-categorias',
      criarDesafioDto.categoria,
    );

    this.logger.log(`categoria: ${JSON.stringify(categoria)}`);

    if (!categoria) {
      throw new BadRequestException(`Categoria informada não existe!`);
    }

    await firstValueFrom(
      this.clientDesafios.emit('criar-desafio', criarDesafioDto),
    );
  }

  @Get()
  async consultarDesafios(@Query('idJogador') idJogador: string): Promise<any> {
    if (idJogador) {
      await this.clientAdminBackend
        .send('consultar-jogadores', idJogador)
        .subscribe((jogador: Jogador) => {
          this.logger.log(`jogador: ${JSON.stringify(jogador)}`);

          if (!jogador) {
            throw new BadRequestException(`Jogador não cadastrado!`);
          }

          return this.clientDesafios
            .send('consultar-desafios', { idJogador: idJogador, _id: '' })
            .subscribe();
        });
    }
  }

  @Put('/:desafio')
  async atualizarDesafio(
    @Body(DesafioStatusValidacaoPipe) atualizarDesafioDto: AtualizarDesafioDto,
    @Param('desafio') _id: string,
  ) {
    const desafio: Desafio = await firstValueFrom(
      this.clientDesafios.send('consultar-desafios', {
        idJogador: '',
        _id: _id,
      }),
    );

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    if (desafio.status != DesafioStatus.PENDENTE) {
      throw new BadRequestException(
        'Somente desafios com status PENDENTE podem ser atualizados!',
      );
    }

    await this.clientDesafios.emit('atualizar-desafio', {
      id: _id,
      desafio: atualizarDesafioDto,
    });
  }

  @Post('/:desafio/partida/')
  async atribuirDesafioPartida(
    @Body(ValidationPipe) atribuirDesafioPartidaDto: AtribuirDesafioPartidaDto,
    @Param('desafio') _id: string,
  ) {
    await this.clientDesafios
      .send('consultar-desafios', { idJogador: '', _id: _id })
      .subscribe(async (desafio: Desafio) => {
        this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

        if (!desafio) {
          throw new BadRequestException(`Desafio não cadastrado!`);
        }

        if (desafio.status == DesafioStatus.REALIZADO) {
          throw new BadRequestException(`Desafio já realizado!`);
        }

        if (desafio.status != DesafioStatus.ACEITO) {
          throw new BadRequestException(
            `Partidas somente podem ser lançadas em desafios aceitos pelos adversários!`,
          );
        }

        if (!desafio.jogadores.includes(atribuirDesafioPartidaDto.def)) {
          throw new BadRequestException(
            `O jogador vencedor da partida deve fazer parte do desafio!`,
          );
        }

        const partida: Partida = {};
        partida.categoria = desafio.categoria;
        partida.def = atribuirDesafioPartidaDto.def;
        partida.desafio = _id;
        partida.jogadores = desafio.jogadores;
        partida.resultado = atribuirDesafioPartidaDto.resultado;

        await this.clientDesafios.emit('criar-partida', partida);
      });
  }

  @Delete('/:_id')
  async deletarDesafio(@Param('_id') _id: string) {
    const desafio: Desafio = await this.clientDesafios
      .send('consultar-desafios', { idJogador: '', _id: _id })
      .toPromise();

    this.logger.log(`desafio: ${JSON.stringify(desafio)}`);

    /*
            Verificamos se o desafio está cadastrado
        */
    if (!desafio) {
      throw new BadRequestException(`Desafio não cadastrado!`);
    }

    await this.clientDesafios.emit('deletar-desafio', desafio);
  }
}
