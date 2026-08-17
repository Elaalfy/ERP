import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SetPermissionDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  companyId: string;

  @IsString()
  @MaxLength(40)
  module: string;

  @IsOptional()
  @IsBoolean()
  view?: boolean;

  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @IsOptional()
  @IsBoolean()
  edit?: boolean;

  @IsOptional()
  @IsBoolean()
  approve?: boolean;

  @IsOptional()
  @IsBoolean()
  delete?: boolean;

  @IsOptional()
  @IsBoolean()
  export?: boolean;
}
