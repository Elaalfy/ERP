import { MigrationInterface, QueryRunner } from "typeorm";

export class AccountingModuleInit1786165532799 implements MigrationInterface {
    name = 'AccountingModuleInit1786165532799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "vat_number" character varying(20), "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying(150) NOT NULL, "email" character varying(150) NOT NULL, "passwordHash" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "coa_template_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" uuid NOT NULL, "parent_id" uuid, "code" character varying(20) NOT NULL, "name_ar" character varying(150) NOT NULL, "name_en" character varying(150), "account_type" character varying(20) NOT NULL, "normal_balance" character varying(10) NOT NULL, "is_group" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f2e1b9594a7f31523842b91cad5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "coa_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_439971bb336186e9e0fe5d214e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "parent_id" uuid, "code" character varying(20) NOT NULL, "name_ar" character varying(150) NOT NULL, "name_en" character varying(150), "account_type" character varying(20) NOT NULL, "normal_balance" character varying(10) NOT NULL, "is_group" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "source_template_account_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3688be9335dbbeeab258a69e0c4" UNIQUE ("company_id", "code"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fiscal_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "status" character varying(10) NOT NULL DEFAULT 'open', CONSTRAINT "PK_9bb1e4e84a0d820b943e116888d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "journal_entry_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "journal_entry_id" uuid NOT NULL, "account_id" uuid NOT NULL, "debit" numeric(14,2) NOT NULL DEFAULT '0', "credit" numeric(14,2) NOT NULL DEFAULT '0', "line_note" text, CONSTRAINT "CHK_b272217b61b03ae04e8bda12fa" CHECK ("debit" = 0 OR "credit" = 0), CONSTRAINT "PK_b2f60e3664cd9803a829fb61aa4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "journal_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "period_id" uuid NOT NULL, "entry_number" character varying(30) NOT NULL, "entry_date" date NOT NULL, "source_type" character varying(20) NOT NULL, "source_ref_id" character varying, "description" text, "created_by" uuid NOT NULL, "is_manual" boolean NOT NULL DEFAULT false, "status" character varying(10) NOT NULL DEFAULT 'posted', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_793d0c733787f9a849b018c0e05" UNIQUE ("company_id", "entry_number"), CONSTRAINT "PK_a70368e64230434457c8d007ab3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mandatory_field_catalog" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "field_key" character varying(50) NOT NULL, "label_ar" character varying(150) NOT NULL, "zatca_required" boolean NOT NULL DEFAULT true, "warning_message" text NOT NULL, CONSTRAINT "UQ_f428137beaea5e4ec3f78887c6d" UNIQUE ("field_key"), CONSTRAINT "PK_bf8bfa3ea6fd15d29e0655e7832" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoice_template_fields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template_id" uuid NOT NULL, "field_key" character varying(50) NOT NULL, "field_label" character varying(150) NOT NULL, "is_visible" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL, "is_custom_field" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_f831b921684804994833b9a89ec" UNIQUE ("template_id", "field_key"), CONSTRAINT "PK_775bd8fc1af12dcfaef4f53a266" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoice_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "logo_url" text, "theme_settings" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3a8370502b9ce87ef136481ddcf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "coa_template_accounts" ADD CONSTRAINT "FK_132f55115e994933b64de176f4f" FOREIGN KEY ("template_id") REFERENCES "coa_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coa_template_accounts" ADD CONSTRAINT "FK_3bb8f3123a7654423186241a507" FOREIGN KEY ("parent_id") REFERENCES "coa_template_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_b22c8136b3e83352b0013224801" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_f7ea327e4100ce4d6002ecdd12b" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_402afc78866fcfe40ca35893033" FOREIGN KEY ("source_template_account_id") REFERENCES "coa_template_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fiscal_periods" ADD CONSTRAINT "FK_fb98313e69d23dbf69c73db672b" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "FK_9a54f62140d93c608634baad589" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "FK_4a4fcd732e7b109880444ebc9c1" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_435ac51210483ad504efff69a40" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_6810faef967648107011edb0021" FOREIGN KEY ("period_id") REFERENCES "fiscal_periods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "FK_dee7f9cf07c67fce5f6018ac32f" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_template_fields" ADD CONSTRAINT "FK_696a6841ae0a08837e1e6dd80e9" FOREIGN KEY ("template_id") REFERENCES "invoice_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_templates" ADD CONSTRAINT "FK_36c7f6e71cd4ee8a8a39c6a13e3" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice_templates" DROP CONSTRAINT "FK_36c7f6e71cd4ee8a8a39c6a13e3"`);
        await queryRunner.query(`ALTER TABLE "invoice_template_fields" DROP CONSTRAINT "FK_696a6841ae0a08837e1e6dd80e9"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_dee7f9cf07c67fce5f6018ac32f"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_6810faef967648107011edb0021"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "FK_435ac51210483ad504efff69a40"`);
        await queryRunner.query(`ALTER TABLE "journal_entry_lines" DROP CONSTRAINT "FK_4a4fcd732e7b109880444ebc9c1"`);
        await queryRunner.query(`ALTER TABLE "journal_entry_lines" DROP CONSTRAINT "FK_9a54f62140d93c608634baad589"`);
        await queryRunner.query(`ALTER TABLE "fiscal_periods" DROP CONSTRAINT "FK_fb98313e69d23dbf69c73db672b"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_402afc78866fcfe40ca35893033"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_f7ea327e4100ce4d6002ecdd12b"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_b22c8136b3e83352b0013224801"`);
        await queryRunner.query(`ALTER TABLE "coa_template_accounts" DROP CONSTRAINT "FK_3bb8f3123a7654423186241a507"`);
        await queryRunner.query(`ALTER TABLE "coa_template_accounts" DROP CONSTRAINT "FK_132f55115e994933b64de176f4f"`);
        await queryRunner.query(`DROP TABLE "invoice_templates"`);
        await queryRunner.query(`DROP TABLE "invoice_template_fields"`);
        await queryRunner.query(`DROP TABLE "mandatory_field_catalog"`);
        await queryRunner.query(`DROP TABLE "journal_entries"`);
        await queryRunner.query(`DROP TABLE "journal_entry_lines"`);
        await queryRunner.query(`DROP TABLE "fiscal_periods"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "coa_templates"`);
        await queryRunner.query(`DROP TABLE "coa_template_accounts"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "companies"`);
    }

}
