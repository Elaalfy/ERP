import { MigrationInterface, QueryRunner } from "typeorm";

export class PurchasingModuleInit1786214552673 implements MigrationInterface {
    name = 'PurchasingModuleInit1786214552673'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "phone" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "purchase_invoice_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "purchase_invoice_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(14,3) NOT NULL, "unit_cost" numeric(14,4) NOT NULL, "line_total" numeric(14,2) NOT NULL, "stock_batch_id" character varying, CONSTRAINT "PK_0052805e432dca6a57d51f66f7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "purchase_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "invoice_number" character varying(30) NOT NULL, "supplier_invoice_ref" character varying(50), "invoice_date" TIMESTAMP WITH TIME ZONE NOT NULL, "supplier_id" uuid NOT NULL, "payment_method" character varying(10) NOT NULL, "subtotal" numeric(14,2) NOT NULL, "vat_amount" numeric(14,2) NOT NULL DEFAULT '0', "total_amount" numeric(14,2) NOT NULL, "journal_entry_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6d47fd390940570a9e97a612a24" UNIQUE ("company_id", "invoice_number"), CONSTRAINT "PK_efa8a22a9bf7685952deba65c30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "supplier_ledger" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "supplier_id" uuid NOT NULL, "type" character varying(15) NOT NULL, "amount" numeric(14,2) NOT NULL, "reference_id" character varying, "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21685feb22810ceceae29346ea8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_6a9681499416e80c1ffac4fe86c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "FK_803b51efedd865a06ae5eaf1004" FOREIGN KEY ("purchase_invoice_id") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" ADD CONSTRAINT "FK_a835c962e715f4db7ed616e182e" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoices" ADD CONSTRAINT "FK_75ff18e57b52d8ffce83d0c5638" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoices" ADD CONSTRAINT "FK_630ee361e2d29027088cf136b3a" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier_ledger" ADD CONSTRAINT "FK_b6da8f3145ce7ddfbaff7a961ca" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier_ledger" DROP CONSTRAINT "FK_b6da8f3145ce7ddfbaff7a961ca"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoices" DROP CONSTRAINT "FK_630ee361e2d29027088cf136b3a"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoices" DROP CONSTRAINT "FK_75ff18e57b52d8ffce83d0c5638"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" DROP CONSTRAINT "FK_a835c962e715f4db7ed616e182e"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_lines" DROP CONSTRAINT "FK_803b51efedd865a06ae5eaf1004"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_6a9681499416e80c1ffac4fe86c"`);
        await queryRunner.query(`DROP TABLE "supplier_ledger"`);
        await queryRunner.query(`DROP TABLE "purchase_invoices"`);
        await queryRunner.query(`DROP TABLE "purchase_invoice_lines"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
    }

}
