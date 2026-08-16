import { IsString, MinLength, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyRoleAssignmentDto } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isGroupManager?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  // عند إرسالها، تستبدل بالكامل مجموعة أدوار الشركات الحالية للمستخدم
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyRoleAssignmentDto)
  companyRoles?: CompanyRoleAssignmentDto[];
}
