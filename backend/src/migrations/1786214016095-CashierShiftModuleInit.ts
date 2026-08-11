import { MigrationInterface, QueryRunner } from "typeorm";

export class CashierShiftModuleInit1786214016095 implements MigrationInterface {
    name = 'CashierShiftModuleInit1786214016095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cashier_shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "cashier_id" uuid NOT NULL, "opening_cash" numeric(14,2) NOT NULL DEFAULT '0', "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL, "closed_at" TIMESTAMP WITH TIME ZONE, "expected_cash_sales" numeric(14,2), "counted_cash" numeric(14,2), "cash_variance" numeric(14,2), "status" character varying(10) NOT NULL DEFAULT 'open', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_63623500bd6b2e994439e4cd6e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "shift_id" character varying`);
        await queryRunner.query(`ALTER TABLE "cashier_shifts" ADD CONSTRAINT "FK_d8d93d9d0673bab6c49944818f8" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cashier_shifts" ADD CONSTRAINT "FK_4ed3632bf44911a0bff5f2d29ac" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cashier_shifts" DROP CONSTRAINT "FK_4ed3632bf44911a0bff5f2d29ac"`);
        await queryRunner.query(`ALTER TABLE "cashier_shifts" DROP CONSTRAINT "FK_d8d93d9d0673bab6c49944818f8"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "shift_id"`);
        await queryRunner.query(`DROP TABLE "cashier_shifts"`);
    }

}
