import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { PayrollRun } from './entities/payroll-run.entity';
import { Payslip } from './entities/payslip.entity';
import { EmployeesService } from './services/employees.service';
import { PayrollService } from './services/payroll.service';
import { EmployeesController, PayrollController } from './controllers/hr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, PayrollRun, Payslip])],
  providers: [EmployeesService, PayrollService],
  controllers: [EmployeesController, PayrollController],
})
export class HrModule {}
