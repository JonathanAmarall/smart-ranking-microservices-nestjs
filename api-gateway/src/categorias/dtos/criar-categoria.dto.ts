import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { Evento } from 'src/interfaces/evento.interface';

export class CriarCategoriaDto {
  @IsString()
  @IsNotEmpty()
  readonly categoria: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsArray()
  @ArrayMinSize(1)
  eventos: Array<Evento>;
}
