import { MigrationInterface, QueryRunner } from "typeorm";

export class MustChangePasswordInit1786818300000 implements MigrationInterface {
    name = 'MustChangePasswordInit1786818300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "must_change_password" boolean NOT NULL DEFAULT false`);

        // حساب المدير المزروع تلقائياً بكلمة مرور افتراضية معروفة (ChangeMe123!) يُجبر على تغييرها فوراً عند أول دخول
        await queryRunner.query(
            `UPDATE "users" SET "must_change_password" = true WHERE "email" = 'admin@elaalfy.local'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "must_change_password"`);
    }

}
