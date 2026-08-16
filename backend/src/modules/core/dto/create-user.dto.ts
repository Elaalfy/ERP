import { IsEmail, IsString, MinLength, IsBoolean, IsOptional, IsArray, ValidateNested, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyRoleAssignmentDto {
  @IsUUID()
  companyId: string;

  @IsIn(['accountant', 'cashier', 'employee'])
  role: 'accountant' | 'cashier' | 'employee';
}

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  isGroupManager?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyRoleAssignmentDto)
  companyRoles?: CompanyRoleAssignmentDto[];
}
