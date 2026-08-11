import { IsString, IsOptional, MaxLength, IsIn, IsBoolean, IsUUID } from 'class-validator';

export class CreateAccountDto {
  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsString()
  @MaxLength(150)
  nameAr: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameEn?: string;

  @IsIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
  accountType: string;

  @IsIn(['debit', 'credit'])
  normalBalance: string;

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}

export class CopyTemplateDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  templateId: string;
}
