import { MigrationInterface, QueryRunner } from "typeorm";

export class SalesInventoryModuleInit1786213695289 implements MigrationInterface {
    name = 'SalesInventoryModuleInit1786213695289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "sku" character varying(50) NOT NULL, "name_ar" character varying(150) NOT NULL, "barcode" character varying(50), "sale_price" numeric(14,2) NOT NULL, "min_stock" numeric(14,2) NOT NULL DEFAULT '0', "max_stock" numeric(14,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4af79b7459791a250e1cd546176" UNIQUE ("company_id", "sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stock_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "product_id" uuid NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL, "unit_cost" numeric(14,4) NOT NULL, "quantity_received" numeric(14,3) NOT NULL, "quantity_remaining" numeric(14,3) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_85b4f081f5a5c69009675db8b1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "phone" character varying(20), "credit_limit" numeric(14,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoice_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit_price" numeric(14,2) NOT NULL, "unit_cost" numeric(14,4) NOT NULL, "line_total" numeric(14,2) NOT NULL, CONSTRAINT "PK_3d18eb48142b916f581f0c21a65" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "invoice_number" character varying(30) NOT NULL, "invoice_date" TIMESTAMP WITH TIME ZONE NOT NULL, "customer_id" uuid, "template_id" uuid, "payment_method" character varying(10) NOT NULL, "subtotal" numeric(14,2) NOT NULL, "vat_amount" numeric(14,2) NOT NULL DEFAULT '0', "total_amount" numeric(14,2) NOT NULL, "total_cost" numeric(14,4) NOT NULL DEFAULT '0', "journal_entry_id" character varying, "status" character varying(10) NOT NULL DEFAULT 'posted', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c72926e1735b41a93b9c5f57c01" UNIQUE ("company_id", "invoice_number"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" uuid NOT NULL, "type" character varying(15) NOT NULL, "amount" numeric(14,2) NOT NULL, "reference_id" character varying, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0948ca0aa3febbe1df572618e0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_b417f1726f6ccafb18730adffb0" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_batches" ADD CONSTRAINT "FK_f39c7f9111178beb107ed5184de" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_batches" ADD CONSTRAINT "FK_05335ed686951b71ea85d273661" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_f0e29920aaf871f3eddbea69f0d" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_lines" ADD CONSTRAINT "FK_2da95dc86a54a00ff20ce46d0fe" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_lines" ADD CONSTRAINT "FK_975593df931842435a9c6979c55" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_42385e42f092f26bd38df549717" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_65e3145f317bd655481d3f96c74" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_6a3d1f4966685eff205b3c3acfc" FOREIGN KEY ("template_id") REFERENCES "invoice_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_ledger" ADD CONSTRAINT "FK_317a1ab7ef50a8d6d3f14e6bb15" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_ledger" DROP CONSTRAINT "FK_317a1ab7ef50a8d6d3f14e6bb15"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_6a3d1f4966685eff205b3c3acfc"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_65e3145f317bd655481d3f96c74"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_42385e42f092f26bd38df549717"`);
        await queryRunner.query(`ALTER TABLE "invoice_lines" DROP CONSTRAINT "FK_975593df931842435a9c6979c55"`);
        await queryRunner.query(`ALTER TABLE "invoice_lines" DROP CONSTRAINT "FK_2da95dc86a54a00ff20ce46d0fe"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_f0e29920aaf871f3eddbea69f0d"`);
        await queryRunner.query(`ALTER TABLE "stock_batches" DROP CONSTRAINT "FK_05335ed686951b71ea85d273661"`);
        await queryRunner.query(`ALTER TABLE "stock_batches" DROP CONSTRAINT "FK_f39c7f9111178beb107ed5184de"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_b417f1726f6ccafb18730adffb0"`);
        await queryRunner.query(`DROP TABLE "customer_ledger"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "invoice_lines"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "stock_batches"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
