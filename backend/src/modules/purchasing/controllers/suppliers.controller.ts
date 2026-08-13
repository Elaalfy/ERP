import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';
import { PaySupplierDto } from '../dto/purchase-invoice.dto';

@Controller('purchasing/suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

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
    return { supplierId: id, balance };
  }

  @Get(':id/ledger')
  getLedger(@Param('id') id: string) {
    return this.service.getLedger(id);
  }

  @Post(':id/payments')
  payInvoice(@Param('id') id: string, @Body() dto: PaySupplierDto) {
    return this.service.payInvoice(id, dto);
  }
}
