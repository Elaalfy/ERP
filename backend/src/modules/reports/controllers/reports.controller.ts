import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { GroupManagerGuard } from '../../auth/guards/group-manager.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';

@Controller('reports/group')
@UseGuards(GroupManagerGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('summary')
  getGroupSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.getGroupSummary(
      user.id,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('receivables-aging')
  getReceivablesAging(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getReceivablesAging(user.id);
  }

  @Get('payables-aging')
  getPayablesAging(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getPayablesAging(user.id);
  }
}
