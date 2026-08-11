import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PurchaseInvoicesService } from '../services/purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from '../dto/purchase-invoice.dto';

@Controller('purchasing/invoices')
export class PurchaseInvoicesController {
  constructor(private readonly service: PurchaseInvoicesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }
}
