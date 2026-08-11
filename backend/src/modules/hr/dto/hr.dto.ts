import { IsString, IsOptional, MaxLength, IsUUID, IsNumber, Min, IsDateString, IsArray, ValidateNested, IsInt, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @IsUUID()
  companyId: string;

  @IsString()
  @MaxLength(150)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsDateString()
  hireDate: string;

  @IsNumber()
  @Min(0)
  basicSalary: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedAllowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gosiEmployeeRate?: number;
}

export class ManualDeductionDto {
  @IsUUID()
  employeeId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class RunPayrollDto {
  @IsUUID()
  companyId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsInt()
  periodYear: number;

  @IsUUID()
  periodId: string; // الفترة المالية المحاسبية

  @IsUUID()
  createdById: string;

  @IsUUID()
  salaryExpenseAccountId: string; // مصروف الرواتب (مدين)

  @IsUUID()
  gosiPayableAccountId: string; // التأمينات الاجتماعية المستحقة (دائن)

  @IsUUID()
  salariesPayableAccountId: string; // الرواتب المستحقة الدفع للموظفين (دائن)

  @IsOptional()
  @IsUUID()
  employeeAdvancesAccountId?: string; // ذمم سلف الموظفين (أصل)، مطلوب فقط إذا وُجدت خصومات يدوية

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualDeductionDto)
  manualDeductions?: ManualDeductionDto[];
}
