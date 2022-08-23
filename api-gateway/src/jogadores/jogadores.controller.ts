import {
  Controller,
  Get,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Query,
  Put,
  Param,
  BadRequestException,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CriarJogadorDto } from './dtos/criar-jogador.dto';
import { AtualizarJogadorDto } from './dtos/atualizar-jogador.dto';
import { Observable } from 'rxjs';
import { ClientProxySmartRanking } from '../proxyrmq/client-proxy';
import { Request } from 'express';
import { ValidacaoParametrosPipe } from 'src/common/pipes/validar-parametros.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { Jogador } from './interfaces/jogador.interface';
import { AwsService } from 'src/aws/aws.service';

@Controller('api/v1/jogadores')
export class JogadoresController {
  private logger = new Logger(JogadoresController.name);

  constructor(
    private clientProxySmartRanking: ClientProxySmartRanking,
    private readonly awsService: AwsService,
  ) {}

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  @Post()
  @UsePipes(ValidationPipe)
  criarJogador(@Body() criarJogadorDto: CriarJogadorDto) {
    this.logger.log(`criarJogadorDto: ${JSON.stringify(criarJogadorDto)}`);

    this.clientAdminBackend
      .send('consultar-categorias', criarJogadorDto.categoria)
      .subscribe((categoria) => {
        if (categoria) {
          this.clientAdminBackend.emit('criar-jogador', criarJogadorDto);
        } else {
          throw new BadRequestException(`Categoria não cadastrada!`);
        }
      });
  }

  @Post('/:_id/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadArquivo(@UploadedFile() file, @Param('_id') _id: string) {
    this.clientAdminBackend
      .send('consultar-jogadores', _id)
      .subscribe(async (jogador: Jogador) => {
        if (!jogador) {
          throw new BadRequestException(`Jogador não encontrado!`);
        }

        const urlFotoJogador: { url: '' } = await this.awsService.uploadArquivo(
          file,
          _id,
        );

        this.logger.log(urlFotoJogador.url);

        const atualizarJogadorDto: AtualizarJogadorDto = {};
        atualizarJogadorDto.urlFotoJogador = urlFotoJogador.url;

        this.clientAdminBackend.emit('atualizar-jogador', {
          id: _id,
          jogador: atualizarJogadorDto,
        });

        return this.clientAdminBackend
          .send('consultar-jogadores', _id)
          .subscribe();
      });
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get()
  consultarJogadores(@Query('idJogador') _id: string): Observable<any> {
    console.log('oi');
    return this.clientAdminBackend.send('consultar-jogadores', _id ? _id : '');
  }

  @Put('/:_id')
  @UsePipes(ValidationPipe)
  atualizarJogador(
    @Body() atualizarJogadorDto: AtualizarJogadorDto,
    @Param('_id', ValidacaoParametrosPipe) _id: string,
  ) {
    this.clientAdminBackend
      .send('consultar-categorias', atualizarJogadorDto.categoria)
      .subscribe((categoria) => {
        if (categoria) {
          this.clientAdminBackend.emit('atualizar-jogador', {
            id: _id,
            jogador: atualizarJogadorDto,
          });
        } else {
          throw new BadRequestException(`Categoria não cadastrada!`);
        }
      });
  }

  @Delete('/:_id')
  deletarJogador(@Param('_id', ValidacaoParametrosPipe) _id: string) {
    this.clientAdminBackend.emit('deletar-jogador', { _id });
  }
}
