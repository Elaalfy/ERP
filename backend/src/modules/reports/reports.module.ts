import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../core/entities/user.entity';
import { Company } from '../core/entities/company.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
