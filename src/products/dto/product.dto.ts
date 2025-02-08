import {
  IsString,
  IsNumber,
  IsArray,
  Min,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
  IsInt,
  IsOptional,
  IsIn,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

/**
 * 상품 등록 dto
 */
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  brand: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options: ProductOptionDto[];

  @IsString()
  @IsNotEmpty()
  userId: string;
}

/**
 * 상품 수정 dto
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductOptionDto {
  @IsString()
  @IsNotEmpty()
  size: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsInt()
  @Min(0)
  stock: number;
}

export class QueryProductDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  @IsIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'likes_desc'])
  sort?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
