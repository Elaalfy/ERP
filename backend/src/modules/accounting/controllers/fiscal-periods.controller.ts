import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FiscalPeriodsService } from '../services/fiscal-periods.service';
import { CreateFiscalPeriodDto, GenerateFiscalYearDto } from '../dto/fiscal-period.dto';

@Controller('accounting/fiscal-periods')
export class FiscalPeriodsController {
  constructor(private readonly service: FiscalPeriodsService) {}

  @Get()
  findAllForCompany(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }

  @Get('active')
  findActive(@Query('companyId') companyId: string) {
    return this.service.findActive(companyId);
  }

  @Post()
  create(@Body() dto: CreateFiscalPeriodDto) {
    return this.service.create(dto);
  }

  @Post('generate-year')
  generateYear(@Body() dto: GenerateFiscalYearDto) {
    return this.service.generateYear(dto);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }

  @Post(':id/reopen')
  reopen(@Param('id') id: string) {
    return this.service.reopen(id);
  }
}
