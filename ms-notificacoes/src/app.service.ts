import { firstValueFrom } from 'rxjs';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Jogador } from './interfaces/jogador.interface';
import { ClientProxySmartRanking } from './proxyrmq/client-proxy';
import { RpcException } from '@nestjs/microservices';
import HTML_NOTIFICACAO_ADVERSARIO from './static/html-notificacao-adversario';
import { Desafio } from './interfaces/desafio.interface';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  /**
   *
   */
  constructor(
    private clientProxySmartRanking: ClientProxySmartRanking,
    private readonly mailService: MailerService,
  ) {}

  async enviarEmailParaAdversario(desafio: Desafio) {
    try {
      let idAdversario = '';

      desafio.jogadores.map((jogador) => {
        if (jogador != desafio.solicitante) {
          idAdversario = jogador;
        }
      });

      const adversario: Jogador = await firstValueFrom(
        this.clientAdminBackend.send('consultar-jogadores', idAdversario),
      );

      const solicitante: Jogador = await firstValueFrom(
        this.clientAdminBackend.send(
          'consultar-jogadores',
          desafio.solicitante,
        ),
      );

      let markup = '';

      markup = HTML_NOTIFICACAO_ADVERSARIO;
      markup = markup.replace(/#NOME_ADVERSARIO/g, adversario.nome);
      markup = markup.replace(/#NOME_SOLICITANTE/g, solicitante.nome);

      this.mailService
        .sendMail({
          to: adversario.email,
          from: `"SMART RANKING" <api.smartranking@gmail.com>`,
          subject: 'Notificação de Desafio',
          html: markup,
        })
        .then((success) => {
          this.logger.log(success);
        })
        .catch((err) => {
          this.logger.error(err);
        });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }
}
