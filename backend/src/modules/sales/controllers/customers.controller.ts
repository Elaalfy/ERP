import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CustomersService } from '../services/customers.service';

@Controller('sales/customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string) {
    const balance = await this.service.getBalance(id);
    return { customerId: id, balance };
  }
}
