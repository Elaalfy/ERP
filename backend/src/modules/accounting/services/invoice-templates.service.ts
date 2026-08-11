import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceTemplate } from '../entities/invoice-template.entity';
import { MandatoryFieldCatalog } from '../entities/mandatory-field-catalog.entity';
import { CreateInvoiceTemplateDto } from '../dto/invoice-template.dto';

@Injectable()
export class InvoiceTemplatesService {
  constructor(
    @InjectRepository(InvoiceTemplate)
    private readonly templateRepo: Repository<InvoiceTemplate>,
    @InjectRepository(MandatoryFieldCatalog)
    private readonly catalogRepo: Repository<MandatoryFieldCatalog>,
  ) {}

  async create(dto: CreateInvoiceTemplateDto) {
    const template = this.templateRepo.create({
      companyId: dto.companyId,
      name: dto.name,
      isDefault: dto.isDefault,
      logoUrl: dto.logoUrl,
      themeSettings: dto.themeSettings,
      fields: dto.fields.map((f) => ({
        fieldKey: f.fieldKey,
        fieldLabel: f.fieldLabel,
        isVisible: f.isVisible,
        displayOrder: f.displayOrder,
        isCustomField: f.isCustomField ?? false,
      })) as any,
    });

    const saved = await this.templateRepo.save(template);

    // فحص إعلامي: أي حقل إلزامي بموجب ZATCA وتم إخفاؤه، يُرجع كتنبيه للواجهة (لا يمنع الحفظ)
    const warnings = await this.checkMandatoryFieldWarnings(dto.fields);

    return { template: saved, warnings };
  }

  private async checkMandatoryFieldWarnings(fields: { fieldKey: string; isVisible: boolean }[]) {
    const hiddenKeys = fields.filter((f) => !f.isVisible).map((f) => f.fieldKey);
    if (hiddenKeys.length === 0) return [];

    const mandatoryHidden = await this.catalogRepo
      .createQueryBuilder('c')
      .where('c.fieldKey IN (:...keys)', { keys: hiddenKeys })
      .andWhere('c.zatcaRequired = true')
      .getMany();

    return mandatoryHidden.map((m) => ({
      fieldKey: m.fieldKey,
      warningMessage: m.warningMessage,
    }));
  }

  findAllForCompany(companyId: string) {
    return this.templateRepo.find({ where: { companyId }, relations: { fields: true } });
  }

  findMandatoryCatalog() {
    return this.catalogRepo.find();
  }
}
