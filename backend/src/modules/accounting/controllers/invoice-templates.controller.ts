import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InvoiceTemplatesService } from '../services/invoice-templates.service';
import { CreateInvoiceTemplateDto } from '../dto/invoice-template.dto';
import { RequirePermission } from '../../authorization/decorators/require-permission.decorator';

@Controller('accounting/invoice-templates')
export class InvoiceTemplatesController {
  constructor(private readonly service: InvoiceTemplatesService) {}

  @Post()
  @RequirePermission('accounting', 'create')
  create(@Body() dto: CreateInvoiceTemplateDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission('accounting', 'view')
  findAllForCompany(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }

  @Get('mandatory-catalog')
  findMandatoryCatalog() {
    return this.service.findMandatoryCatalog();
  }
}
