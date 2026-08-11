import { IsString, IsOptional, MaxLength, IsUUID, IsBoolean, IsArray, ValidateNested, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateFieldDto {
  @IsString()
  fieldKey: string;

  @IsString()
  @MaxLength(150)
  fieldLabel: string;

  @IsBoolean()
  isVisible: boolean;

  @IsInt()
  displayOrder: number;

  @IsOptional()
  @IsBoolean()
  isCustomField?: boolean;
}

export class CreateInvoiceTemplateDto {
  @IsUUID()
  companyId: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsObject()
  themeSettings?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldDto)
  fields: TemplateFieldDto[];
}
