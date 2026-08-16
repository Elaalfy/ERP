import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { User } from './entities/user.entity';
import { UserCompanyRole } from './entities/user-company-role.entity';
import { CompaniesService } from './services/companies.service';
import { CompaniesController } from './controllers/companies.controller';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, UserCompanyRole])],
  providers: [CompaniesService, UsersService],
  controllers: [CompaniesController, UsersController],
  exports: [TypeOrmModule],
})
export class CoreModule {}
