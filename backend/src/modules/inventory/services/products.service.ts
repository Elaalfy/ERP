import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  create(dto: CreateProductDto) {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  findAllForCompany(companyId: string) {
    return this.productRepo.find({ where: { companyId } });
  }

  findOne(id: string) {
    return this.productRepo.findOne({ where: { id } });
  }

  // يُستخدم لاحقاً من Cron Job صباحي لإرسال تنبيهات إعادة الطلب
  async findBelowMinStock(companyId: string, stockLevels: Map<string, number>) {
    const products = await this.productRepo.find({ where: { companyId, isActive: true } });
    return products.filter((p) => (stockLevels.get(p.id) ?? 0) <= Number(p.minStock));
  }
}
