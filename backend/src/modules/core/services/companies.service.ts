import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  create(dto: CreateCompanyDto) {
    const company = this.companyRepo.create(dto);
    return this.companyRepo.save(company);
  }

  findAll() {
    return this.companyRepo.find();
  }

  async findOne(id: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    return company;
  }
}
