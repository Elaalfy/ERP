import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { EmployeesService } from '../services/employees.service';
import { PayrollService } from '../services/payroll.service';
import { CreateEmployeeDto, RunPayrollDto } from '../dto/hr.dto';

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
