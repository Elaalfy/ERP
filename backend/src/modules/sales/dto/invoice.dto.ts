import { IsString, IsOptional, IsUUID, IsIn, IsArray, ValidateNested, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceLineInputDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsIn(['cash', 'card', 'credit'])
  paymentMethod: string;

  // نسبة الضريبة (مثال: 0.15 لـ 15%)، تُمرَّر من الإعدادات وليست ثابتة بالكود
  @IsNumber()
  @Min(0)
  vatRate: number;

  @IsUUID()
  periodId: string;

  @IsUUID()
  createdById: string;

  // حسابات الترحيل المحاسبي المطلوبة لهذه الفاتورة (لاحقاً ستُقرأ تلقائياً من إعدادات الشركة بدل تمريرها يدوياً)
  @IsUUID()
  cashOrBankAccountId: string; // النقدية/البنك عند الدفع الفوري

  @IsUUID()
  revenueAccountId: string;

  @IsUUID()
  vatPayableAccountId: string;

  @IsUUID()
  arAccountId: string; // ذمم العملاء (تُستخدم فقط عند الدفع الآجل)

  @IsUUID()
  cogsAccountId: string; // تكلفة البضاعة المباعة

  @IsUUID()
  inventoryAccountId: string; // حساب المخزون (أصل)

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineInputDto)
  lines: InvoiceLineInputDto[];
}
