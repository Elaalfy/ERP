import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { StockService } from '../services/stock.service';
import { CreateProductDto, ReceiveStockDto } from '../dto/product.dto';

@Controller('inventory/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
  ) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId: string) {
    return this.productsService.findAllForCompany(companyId);
  }

  @Get(':id/stock')
  async getStock(@Param('id') id: string) {
    const quantity = await this.stockService.getCurrentStock(id);
    return { productId: id, quantity };
  }

  @Post('receive-stock')
  receiveStock(@Body() dto: ReceiveStockDto) {
    return this.stockService.receiveStock(dto);
  }
}
