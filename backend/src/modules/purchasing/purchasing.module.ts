import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { SupplierLedgerEntry } from './entities/supplier-ledger-entry.entity';
import { PurchaseInvoicesService } from './services/purchase-invoices.service';
import { SuppliersService } from './services/suppliers.service';
import { PurchaseInvoicesController } from './controllers/purchase-invoices.controller';
import { SuppliersController } from './controllers/suppliers.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, PurchaseInvoice, PurchaseInvoiceLine, SupplierLedgerEntry]),
    InventoryModule,
  ],
  providers: [PurchaseInvoicesService, SuppliersService],
  controllers: [PurchaseInvoicesController, SuppliersController],
})
export class PurchasingModule {}
