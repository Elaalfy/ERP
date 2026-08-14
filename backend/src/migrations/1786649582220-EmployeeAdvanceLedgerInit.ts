import { MigrationInterface, QueryRunner } from "typeorm";

export class EmployeeAdvanceLedgerInit1786649582220 implements MigrationInterface {
    name = 'EmployeeAdvanceLedgerInit1786649582220'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "employee_advance_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "type" character varying(15) NOT NULL, "amount" numeric(14,2) NOT NULL, "reference_id" character varying, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_employee_advance_ledger_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "employee_advance_ledger" ADD CONSTRAINT "FK_employee_advance_ledger_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_advance_ledger" DROP CONSTRAINT "FK_employee_advance_ledger_employee"`);
        await queryRunner.query(`DROP TABLE "employee_advance_ledger"`);
    }

}
