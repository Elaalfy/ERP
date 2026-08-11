import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';
import { CreateEmployeeDto } from '../dto/hr.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  create(dto: CreateEmployeeDto) {
    const employee = this.employeeRepo.create(dto);
    return this.employeeRepo.save(employee);
  }

  findAllForCompany(companyId: string) {
    return this.employeeRepo.find({ where: { companyId, isActive: true } });
  }
}
