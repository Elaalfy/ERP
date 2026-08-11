import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { InvoiceTemplate } from './invoice-template.entity';

@Entity('invoice_template_fields')
@Unique(['templateId', 'fieldKey'])
export class InvoiceTemplateField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InvoiceTemplate, (template) => template.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: InvoiceTemplate;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'field_key', length: 50 })
  fieldKey: string;

  @Column({ name: 'field_label', length: 150 })
  fieldLabel: string;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ name: 'display_order' })
  displayOrder: number;

  @Column({ name: 'is_custom_field', default: false })
  isCustomField: boolean;
}
