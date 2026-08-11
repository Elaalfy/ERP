import { IsUUID, IsIn, IsNumber, Min, IsArray, ValidateNested, ArrayMinSize, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseLineInputDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseInvoiceDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsString()
  supplierInvoiceRef?: string;

  @IsIn(['cash', 'bank', 'credit'])
  paymentMethod: string;

  @IsNumber()
  @Min(0)
  vatRate: number;

  @IsUUID()
  periodId: string;

  @IsUUID()
  createdById: string;

  // حسابات الترحيل المطلوبة (مؤقتاً صريحة، لحين بناء شاشة إعدادات الحسابات الافتراضية للشركة)
  @IsUUID()
  cashOrBankAccountId: string;

  @IsUUID()
  apAccountId: string; // ذمم الموردين الدائنة (تُستخدم عند الشراء الآجل)

  @IsUUID()
  vatInputAccountId: string; // ضريبة القيمة المضافة القابلة للخصم (أصل)

  @IsUUID()
  inventoryAccountId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineInputDto)
  lines: PurchaseLineInputDto[];
}
