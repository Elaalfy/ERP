import { IsString, IsOptional, MaxLength, IsIn, IsUUID, IsDateString, IsArray, ValidateNested, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalLineDto {
  @IsUUID()
  accountId: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;

  @IsOptional()
  @IsString()
  lineNote?: string;
}

export class CreateJournalEntryDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  periodId: string;

  @IsDateString()
  entryDate: string;

  @IsIn(['sale', 'collection', 'purchase', 'manual', 'adjustment'])
  sourceType: string;

  @IsOptional()
  @IsUUID()
  sourceRefId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  createdById: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
