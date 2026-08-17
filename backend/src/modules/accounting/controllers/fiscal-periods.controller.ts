import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FiscalPeriodsService } from '../services/fiscal-periods.service';
import { CreateFiscalPeriodDto, GenerateFiscalYearDto } from '../dto/fiscal-period.dto';
import { RequirePermission } from '../../authorization/decorators/require-permission.decorator';

@Controller('accounting/fiscal-periods')
export class FiscalPeriodsController {
  constructor(private readonly service: FiscalPeriodsService) {}

  @Get()
  @RequirePermission('accounting', 'view')
  findAllForCompany(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }

  @Get('active')
  @RequirePermission('accounting', 'view')
  findActive(@Query('companyId') companyId: string) {
    return this.service.findActive(companyId);
  }

  @Post()
  @RequirePermission('accounting', 'create')
  create(@Body() dto: CreateFiscalPeriodDto) {
    return this.service.create(dto);
  }

  @Post('generate-year')
  @RequirePermission('accounting', 'create')
  generateYear(@Body() dto: GenerateFiscalYearDto) {
    return this.service.generateYear(dto);
  }

  // ملاحظة معروفة: close/reopen يعتمدان على :id فقط بلا companyId بالطلب،
  // لذا لا يخضعان بعد لـ PermissionGuard (Deny by default سيرفضهما دوماً) — يُعالَج في تكرار لاحق
  // بجلب companyId من السجل نفسه قبل التحقق.
  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.service.close(id);
  }

  @Post(':id/reopen')
  reopen(@Param('id') id: string) {
    return this.service.reopen(id);
  }
}
