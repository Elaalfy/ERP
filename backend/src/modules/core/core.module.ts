import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { User } from './entities/user.entity';
import { CompaniesService } from './services/companies.service';
import { CompaniesController } from './controllers/companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User])],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [TypeOrmModule],
})
export class CoreModule {}
