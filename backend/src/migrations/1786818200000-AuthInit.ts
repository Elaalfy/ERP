import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class AuthInit1786818200000 implements MigrationInterface {
    name = 'AuthInit1786818200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_group_manager" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "refresh_token_hash" character varying`);

        // ترحيل: أي مستخدم قديم كان role = 'group_manager' يصبح isGroupManager = true
        await queryRunner.query(`UPDATE "users" SET "is_group_manager" = true WHERE "role" = 'group_manager'`);

        await queryRunner.query(`
            CREATE TABLE "user_company_roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "role" character varying(20) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_user_company_roles_user_company" UNIQUE ("user_id", "company_id"),
                CONSTRAINT "PK_user_company_roles" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "user_company_roles"
            ADD CONSTRAINT "FK_ucr_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "user_company_roles"
            ADD CONSTRAINT "FK_ucr_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
        `);

        // بذرة: أول مستخدم group_manager بكلمة مرور افتراضية (يجب تغييرها فوراً بعد أول دخول)
        const existing = await queryRunner.query(`SELECT id FROM "users" WHERE "email" = 'admin@elaalfy.local'`);
        if (existing.length === 0) {
            const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
            await queryRunner.query(
                `INSERT INTO "users" ("fullName", "email", "passwordHash", "role", "is_group_manager", "isActive")
                 VALUES ('مدير المجموعة', 'admin@elaalfy.local', $1, 'group_manager', true, true)`,
                [passwordHash],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "users" WHERE "email" = 'admin@elaalfy.local'`);
        await queryRunner.query(`ALTER TABLE "user_company_roles" DROP CONSTRAINT "FK_ucr_company"`);
        await queryRunner.query(`ALTER TABLE "user_company_roles" DROP CONSTRAINT "FK_ucr_user"`);
        await queryRunner.query(`DROP TABLE "user_company_roles"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_group_manager"`);
    }

}
