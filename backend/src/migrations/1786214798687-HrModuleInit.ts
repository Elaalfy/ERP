import { MigrationInterface, QueryRunner } from "typeorm";

export class HrModuleInit1786214798687 implements MigrationInterface {
    name = 'HrModuleInit1786214798687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "full_name" character varying(150) NOT NULL, "national_id" character varying(20), "position" character varying(100), "hire_date" date NOT NULL, "basic_salary" numeric(14,2) NOT NULL, "fixed_allowances" numeric(14,2) NOT NULL DEFAULT '0', "gosi_employee_rate" numeric(6,4) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payslips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payroll_run_id" uuid NOT NULL, "employee_id" uuid NOT NULL, "basic_salary" numeric(14,2) NOT NULL, "allowances" numeric(14,2) NOT NULL DEFAULT '0', "gosi_deduction" numeric(14,2) NOT NULL DEFAULT '0', "other_deductions" numeric(14,2) NOT NULL DEFAULT '0', "net_pay" numeric(14,2) NOT NULL, CONSTRAINT "PK_2b1cd07059daf60cc440c9976e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payroll_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "period_month" integer NOT NULL, "period_year" integer NOT NULL, "total_net_pay" numeric(14,2) NOT NULL DEFAULT '0', "journal_entry_id" character varying, "status" character varying(10) NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6e8cec1224b6d8e738d2a68435d" UNIQUE ("company_id", "period_month", "period_year"), CONSTRAINT "PK_6049f42c972640c0eb99ba8035e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_7f3eeef59eece4147effe7bfa6a" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payslips" ADD CONSTRAINT "FK_9163ff0bcaf0212ce23e8f7c5ff" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payslips" ADD CONSTRAINT "FK_3ca6cde51127cd649278d038ca9" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payroll_runs" ADD CONSTRAINT "FK_80b8c94472202fe66289580a6b1" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payroll_runs" DROP CONSTRAINT "FK_80b8c94472202fe66289580a6b1"`);
        await queryRunner.query(`ALTER TABLE "payslips" DROP CONSTRAINT "FK_3ca6cde51127cd649278d038ca9"`);
        await queryRunner.query(`ALTER TABLE "payslips" DROP CONSTRAINT "FK_9163ff0bcaf0212ce23e8f7c5ff"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_7f3eeef59eece4147effe7bfa6a"`);
        await queryRunner.query(`DROP TABLE "payroll_runs"`);
        await queryRunner.query(`DROP TABLE "payslips"`);
        await queryRunner.query(`DROP TABLE "employees"`);
    }

}
