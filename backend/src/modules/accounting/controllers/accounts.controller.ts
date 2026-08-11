import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto, CopyTemplateDto } from '../dto/account.dto';

@Controller('accounting/accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.service.create(dto);
  }

  @Post('copy-template')
  copyTemplate(@Body() dto: CopyTemplateDto) {
    return this.service.copyTemplateToCompany(dto);
  }

  @Get()
  findAllForCompany(@Query('companyId') companyId: string) {
    return this.service.findAllForCompany(companyId);
  }

  @Get('templates')
  findAllTemplates() {
    return this.service.findAllTemplates();
  }
}
