import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { ProductsService } from './services/products.service';
import { StockService } from './services/stock.service';
import { ProductsController } from './controllers/products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockBatch])],
  providers: [ProductsService, StockService],
  controllers: [ProductsController],
  exports: [StockService, TypeOrmModule],
})
export class InventoryModule {}
