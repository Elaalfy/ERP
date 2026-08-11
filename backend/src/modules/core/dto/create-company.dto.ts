import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  vatNumber?: string;
}
