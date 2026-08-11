import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CashierShiftsService } from '../services/cashier-shifts.service';
import { OpenShiftDto, CloseShiftDto } from '../dto/cashier-shift.dto';

@Controller('sales/cashier-shifts')
export class CashierShiftsController {
  constructor(private readonly service: CashierShiftsService) {}

  @Post('open')
  open(@Body() dto: OpenShiftDto) {
    return this.service.open(dto);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.service.close(id, dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
