import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthorizationInit1786818400000 implements MigrationInterface {
    name = 'AuthorizationInit1786818400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "company_id" uuid NOT NULL,
                "module" character varying(40) NOT NULL,
                "view" boolean NOT NULL DEFAULT false,
                "create" boolean NOT NULL DEFAULT false,
                "edit" boolean NOT NULL DEFAULT false,
                "approve" boolean NOT NULL DEFAULT false,
                "delete" boolean NOT NULL DEFAULT false,
                "export" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_user_permissions_user_company_module"
            ON "user_permissions" ("user_id", "company_id", "module")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "FK_user_permissions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "FK_user_permissions_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE TABLE "audit_log" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "user_email" character varying(150),
                "company_id" uuid,
                "module" character varying(40) NOT NULL,
                "action" character varying(20) NOT NULL,
                "method" character varying(10) NOT NULL,
                "path" character varying(255) NOT NULL,
                "entity_id" uuid,
                "status_code" integer NOT NULL,
                "request_body" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_audit_log_company_created" ON "audit_log" ("company_id", "created_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_audit_log_company_created"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_user_permissions_company"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_user_permissions_user"`);
        await queryRunner.query(`DROP INDEX "IDX_user_permissions_user_company_module"`);
        await queryRunner.query(`DROP TABLE "user_permissions"`);
    }

}
