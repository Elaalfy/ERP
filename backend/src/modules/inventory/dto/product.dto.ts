import { IsString, IsOptional, MaxLength, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  companyId: string;

  @IsString()
  @MaxLength(50)
  sku: string;

  @IsString()
  @MaxLength(150)
  nameAr: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;
}

export class ReceiveStockDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}
