import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { CustomerLedgerEntry } from './entities/customer-ledger-entry.entity';
import { CashierShift } from './entities/cashier-shift.entity';
import { InvoicesService } from './services/invoices.service';
import { CustomersService } from './services/customers.service';
import { CashierShiftsService } from './services/cashier-shifts.service';
import { InvoicesController } from './controllers/invoices.controller';
import { CustomersController } from './controllers/customers.controller';
import { CashierShiftsController } from './controllers/cashier-shifts.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Invoice, InvoiceLine, CustomerLedgerEntry, CashierShift]),
    InventoryModule,
  ],
  providers: [InvoicesService, CustomersService, CashierShiftsService],
  controllers: [InvoicesController, CustomersController, CashierShiftsController],
})
export class SalesModule {}
