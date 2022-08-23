import { Document } from 'mongoose';
import { Jogador } from 'src/jogadores/interfaces/jogador.interface';

export interface Categoria extends Document {
  readonly categoria: string;
  descricao: string;
  eventos: Array<Evento>;
}

export interface Evento {
  nome: string;
  operacao: string;
  valor: number;
}
