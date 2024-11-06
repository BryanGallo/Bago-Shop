import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  //transformar
  limit?: number;

  @IsOptional()
  @IsPositive()
  offset?: number;
}
