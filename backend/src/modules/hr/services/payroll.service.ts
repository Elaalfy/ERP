import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PayrollRun } from '../entities/payroll-run.entity';
import { Payslip } from '../entities/payslip.entity';
import { Employee } from '../entities/employee.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { RunPayrollDto } from '../dto/hr.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollRun)
    private readonly payrollRunRepo: Repository<PayrollRun>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly dataSource: DataSource,
  ) {}

  async run(dto: RunPayrollDto) {
    const existing = await this.payrollRunRepo.findOne({
      where: { companyId: dto.companyId, periodMonth: dto.periodMonth, periodYear: dto.periodYear },
    });
    if (existing) {
      throw new BadRequestException(`دورة رواتب هذا الشهر (${dto.periodMonth}/${dto.periodYear}) أُنشئت مسبقاً`);
    }

    const employees = await this.employeeRepo.find({ where: { companyId: dto.companyId, isActive: true } });
    if (employees.length === 0) {
      throw new BadRequestException('لا يوجد موظفون نشطون لإنشاء دورة رواتب');
    }

    const manualDeductionsMap = new Map<string, number>();
    for (const d of dto.manualDeductions ?? []) {
      manualDeductionsMap.set(d.employeeId, (manualDeductionsMap.get(d.employeeId) ?? 0) + d.amount);
    }

    return this.dataSource.transaction(async (manager) => {
      let totalBasic = 0;
      let totalAllowances = 0;
      let totalGosi = 0;
      let totalOtherDeductions = 0;
      let totalNetPay = 0;

      const payslips: Partial<Payslip>[] = [];

      for (const emp of employees) {
        const basicSalary = Number(emp.basicSalary);
        const allowances = Number(emp.fixedAllowances);
        const gosiDeduction = Math.round(basicSalary * Number(emp.gosiEmployeeRate) * 100) / 100;
        const otherDeductions = manualDeductionsMap.get(emp.id) ?? 0;
        const netPay = basicSalary + allowances - gosiDeduction - otherDeductions;

        totalBasic += basicSalary;
        totalAllowances += allowances;
        totalGosi += gosiDeduction;
        totalOtherDeductions += otherDeductions;
        totalNetPay += netPay;

        payslips.push({
          employeeId: emp.id,
          basicSalary,
          allowances,
          gosiDeduction,
          otherDeductions,
          netPay,
        });
      }

      // القيد المحاسبي المجمّع لكل الدورة: مدين مصروف الرواتب الإجمالي (أساسي+بدلات) / دائن التأمينات المستحقة / دائن الرواتب المستحقة للموظفين
      const totalSalaryExpense = totalBasic + totalAllowances;
      const salariesPayableNet = totalSalaryExpense - totalGosi - totalOtherDeductions;

      const journalLines = [{ accountId: dto.salaryExpenseAccountId, debit: totalSalaryExpense, credit: 0 }];
      if (totalGosi > 0) {
        journalLines.push({ accountId: dto.gosiPayableAccountId, debit: 0, credit: totalGosi });
      }
      // صافي الرواتب المستحقة الدفع = إجمالي المصروف - التأمينات - أي خصومات أخرى (سلف، جزاءات)
      journalLines.push({
        accountId: dto.salariesPayableAccountId,
        debit: 0,
        credit: salariesPayableNet,
      });
      // سطر موازن لتسوية السلف المخصومة: تُخفَّض ذمة السلف على الموظف (دائن لحساب الأصل)
      if (totalOtherDeductions > 0) {
        if (!dto.employeeAdvancesAccountId) {
          throw new BadRequestException('يوجد خصومات يدوية لكن لم يُحدَّد حساب سلف الموظفين');
        }
        journalLines.push({ accountId: dto.employeeAdvancesAccountId, debit: 0, credit: totalOtherDeductions });
      }

      const entryNumber = await this.generateEntryNumber(manager, dto.companyId);
      const journalEntry = manager.create(JournalEntry, {
        companyId: dto.companyId,
        periodId: dto.periodId,
        entryNumber,
        entryDate: new Date().toISOString().slice(0, 10),
        sourceType: 'manual',
        description: `قيد آلي لرواتب شهر ${dto.periodMonth}/${dto.periodYear}`,
        createdById: dto.createdById,
        isManual: false,
        status: 'posted',
        lines: journalLines as any,
      });
      const savedJournalEntry = await manager.save(journalEntry);

      const payrollRun = manager.create(PayrollRun, {
        companyId: dto.companyId,
        periodMonth: dto.periodMonth,
        periodYear: dto.periodYear,
        totalNetPay,
        journalEntryId: savedJournalEntry.id,
        status: 'posted',
        payslips: payslips as any,
      });

      return manager.save(payrollRun);
    });
  }

  private async generateEntryNumber(manager: EntityManager, companyId: string): Promise<string> {
    const count = await manager.count(JournalEntry, { where: { companyId } });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }

  findAllForCompany(companyId: string) {
    return this.payrollRunRepo.find({
      where: { companyId },
      relations: { payslips: true },
      order: { periodYear: 'DESC', periodMonth: 'DESC' },
    });
  }
}
