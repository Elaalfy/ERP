import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { JournalEntriesService } from '../services/journal-entries.service';
import { CreateJournalEntryDto } from '../dto/journal-entry.dto';

@Controller('accounting/journal-entries')
export class JournalEntriesController {
  constructor(private readonly service: JournalEntriesService) {}

  @Post()
  create(@Body() dto: CreateJournalEntryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }
}
