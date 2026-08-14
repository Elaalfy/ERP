import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { EmployeesService } from '../services/employees.service';
import { PayrollService } from '../services/payroll.service';
import { EmployeeAdvancesService } from '../services/employee-advances.service';
import { CreateEmployeeDto, RunPayrollDto, GrantAdvanceDto } from '../dto/hr.dto';

@Controller('hr/employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }
}

@Controller('hr/payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Post('run')
  run(@Body() dto: RunPayrollDto) {
    return this.service.run(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }
}

@Controller('hr/employees/:employeeId/advances')
export class EmployeeAdvancesController {
  constructor(private readonly service: EmployeeAdvancesService) {}

  @Post()
  grant(@Param('employeeId') employeeId: string, @Body() dto: GrantAdvanceDto) {
    return this.service.grant(employeeId, dto);
  }

  @Get('ledger')
  getLedger(@Param('employeeId') employeeId: string) {
    return this.service.getLedger(employeeId);
  }

  @Get('balance')
  async getBalance(@Param('employeeId') employeeId: string) {
    return { balance: await this.service.getBalance(employeeId) };
  }
}
