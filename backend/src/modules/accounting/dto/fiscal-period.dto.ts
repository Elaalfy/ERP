import { IsDateString, IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateFiscalPeriodDto {
  @IsUUID()
  companyId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class GenerateFiscalYearDto {
  @IsUUID()
  companyId: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
