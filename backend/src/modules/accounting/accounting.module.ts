import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { CoaTemplate } from './entities/coa-template.entity';
import { CoaTemplateAccount } from './entities/coa-template-account.entity';
import { FiscalPeriod } from './entities/fiscal-period.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { MandatoryFieldCatalog } from './entities/mandatory-field-catalog.entity';
import { InvoiceTemplate } from './entities/invoice-template.entity';
import { InvoiceTemplateField } from './entities/invoice-template-field.entity';

import { AccountsService } from './services/accounts.service';
import { JournalEntriesService } from './services/journal-entries.service';
import { InvoiceTemplatesService } from './services/invoice-templates.service';

import { AccountsController } from './controllers/accounts.controller';
import { JournalEntriesController } from './controllers/journal-entries.controller';
import { InvoiceTemplatesController } from './controllers/invoice-templates.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      CoaTemplate,
      CoaTemplateAccount,
      FiscalPeriod,
      JournalEntry,
      JournalEntryLine,
      MandatoryFieldCatalog,
      InvoiceTemplate,
      InvoiceTemplateField,
    ]),
  ],
  providers: [AccountsService, JournalEntriesService, InvoiceTemplatesService],
  controllers: [AccountsController, JournalEntriesController, InvoiceTemplatesController],
})
export class AccountingModule {}
