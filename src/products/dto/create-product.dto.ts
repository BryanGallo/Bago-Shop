import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsNumber() //a diferencia de int puede recibir decimales
  @IsOptional()
  @IsPositive()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsInt()
  @IsOptional()
  @IsPositive()
  stock?: number;

  @IsString({ each: true }) // indica que cada uno de los elementos del arreglo deben ser string
  @IsArray()
  sizes: string[];

  @IsIn(['men', 'women', 'kid', 'unisex'], {
    message: 'No es un genero valido',
  }) //indica que debe estar dentro de cualquier valor del arreglo o no puede ingresar
  gender?: string;
}
