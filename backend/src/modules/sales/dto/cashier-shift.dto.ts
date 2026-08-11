import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class OpenShiftDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  cashierId: string;

  @IsNumber()
  @Min(0)
  openingCash: number;
}

export class CloseShiftDto {
  @IsNumber()
  @Min(0)
  countedCash: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
