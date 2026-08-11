import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CoaTemplate } from '../entities/coa-template.entity';
import { CoaTemplateAccount } from '../entities/coa-template-account.entity';
import { CreateAccountDto, CopyTemplateDto } from '../dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(CoaTemplate)
    private readonly templateRepo: Repository<CoaTemplate>,
    @InjectRepository(CoaTemplateAccount)
    private readonly templateAccountRepo: Repository<CoaTemplateAccount>,
    private readonly dataSource: DataSource,
  ) {}

  // بناء حساب يدوي واحد (البناء من الصفر)
  create(dto: CreateAccountDto) {
    const account = this.accountRepo.create({
      ...dto,
      accountType: dto.accountType as any,
      normalBalance: dto.normalBalance as any,
    });
    return this.accountRepo.save(account);
  }

  findAllForCompany(companyId: string) {
    return this.accountRepo.find({ where: { companyId }, order: { code: 'ASC' } });
  }

  findAllTemplates() {
    return this.templateRepo.find();
  }

  // نسخ قالب جاهز كاملاً إلى شركة معينة، مع الحفاظ على العلاقات الهرمية (parent_id)
  async copyTemplateToCompany(dto: CopyTemplateDto) {
    const template = await this.templateRepo.findOne({ where: { id: dto.templateId } });
    if (!template) throw new NotFoundException('القالب غير موجود');

    const templateAccounts = await this.templateAccountRepo.find({
      where: { templateId: dto.templateId },
      order: { code: 'ASC' },
    });

    return this.dataSource.transaction(async (manager) => {
      const idMap = new Map<string, string>();
      const created: Account[] = [];
      const remaining = [...templateAccounts];

      // معالجة متعددة المرات: في كل دورة نُنشئ الحسابات التي أصبح أبوها معروفاً (أو ليس لها أب)
      while (remaining.length > 0) {
        const readyIndex = remaining.findIndex(
          (ta) => !ta.parentId || idMap.has(ta.parentId),
        );
        if (readyIndex === -1) break; // حماية من حلقة لا نهائية عند بيانات غير متسقة

        const ta = remaining.splice(readyIndex, 1)[0];
        const newAccount = manager.create(Account, {
          companyId: dto.companyId,
          parentId: ta.parentId ? idMap.get(ta.parentId) : undefined,
          code: ta.code,
          nameAr: ta.nameAr,
          nameEn: ta.nameEn,
          accountType: ta.accountType,
          normalBalance: ta.normalBalance,
          isGroup: ta.isGroup,
          sourceTemplateAccountId: ta.id,
        });
        const saved = await manager.save(newAccount);
        idMap.set(ta.id, saved.id);
        created.push(saved);
      }

      return created;
    });
  }
}
