import { IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { Evento } from 'src/interfaces/evento.interface';

export class AtualizarCategoriaDto {
  @IsString()
  @IsOptional()
  descricao: string;

  @IsArray()
  @ArrayMinSize(1)
  eventos: Array<Evento>;
}
