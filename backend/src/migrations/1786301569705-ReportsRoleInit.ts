import { MigrationInterface, QueryRunner } from "typeorm";

export class ReportsRoleInit1786301569705 implements MigrationInterface {
    name = 'ReportsRoleInit1786301569705'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(20) NOT NULL DEFAULT 'employee'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    }

}
