import { CategoriasService } from './services/categorias.service';
import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { Categoria } from './interfaces/categoria.interface';

const ackErrors: string[] = ['E11000'];
@Controller()
export class CategoriasController {
  logger = new Logger(CategoriasController.name);
  constructor(private readonly categoriaService: CategoriasService) {}

  @EventPattern('criar-categoria') // EventPatter apenas obtem o evento
  async criarCategoria(
    @Payload() categoria: Categoria,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`categoria: ${JSON.stringify(categoria)}`);
    try {
      await this.categoriaService.criarCategoria(categoria);
      await channel.ack(originalMsg); // Confirma mensagem recebida para rabbitmq
    } catch (error) {
      this.logger.error(`error ${JSON.stringify(error)}`);
      ackErrors.map(async (ackError) => {
        if (error.message.includes(ackError)) {
          await channel.ack(originalMsg); // Confirma mensagem recebida para rabbitmq
        }
      });
    }
  }

  @MessagePattern('consultar-categorias') // MessagePattern retorna um valor através do broker
  async consultarCategorias(@Payload() _id: string) {
    if (_id) return await this.categoriaService.consultarCategoriaPeloId(_id);
    else return await this.categoriaService.consultarTodasCategorias();
  }

  @EventPattern('atualizar-categoria')
  async atualizarCategoria(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    this.logger.log(`data: ${JSON.stringify(data)}`);
    try {
      const _id: string = data.id;
      const categoria: Categoria = data.categoria;
      await this.categoriaService.atualizarCategoria(_id, categoria);
      await channel.ack(originalMsg);
    } catch (error) {
      const filterAckError = ackErrors.filter((ackError) =>
        error.message.includes(ackError),
      );

      if (filterAckError.length > 0) {
        await channel.ack(originalMsg);
      }
    }
  }
}
