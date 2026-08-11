import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('reports/group')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('summary')
  getGroupSummary(@Query('userId') userId: string) {
    return this.service.getGroupSummary(userId);
  }

  @Get('receivables-aging')
  getReceivablesAging(@Query('userId') userId: string) {
    return this.service.getReceivablesAging(userId);
  }
}
