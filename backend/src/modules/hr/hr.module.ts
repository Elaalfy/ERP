import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { PayrollRun } from './entities/payroll-run.entity';
import { Payslip } from './entities/payslip.entity';
import { EmployeeAdvanceLedgerEntry } from './entities/employee-advance-ledger-entry.entity';
import { EmployeesService } from './services/employees.service';
import { PayrollService } from './services/payroll.service';
import { EmployeeAdvancesService } from './services/employee-advances.service';
import { EmployeesController, PayrollController, EmployeeAdvancesController } from './controllers/hr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, PayrollRun, Payslip, EmployeeAdvanceLedgerEntry])],
  providers: [EmployeesService, PayrollService, EmployeeAdvancesService],
  controllers: [EmployeesController, PayrollController, EmployeeAdvancesController],
})
export class HrModule {}
