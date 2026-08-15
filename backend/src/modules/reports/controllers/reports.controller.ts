import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('reports/group')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('summary')
  getGroupSummary(
    @Query('userId') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.getGroupSummary(
      userId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('receivables-aging')
  getReceivablesAging(@Query('userId') userId: string) {
    return this.service.getReceivablesAging(userId);
  }

  @Get('payables-aging')
  getPayablesAging(@Query('userId') userId: string) {
    return this.service.getPayablesAging(userId);
  }
}
