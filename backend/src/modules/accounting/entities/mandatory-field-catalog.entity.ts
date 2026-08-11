import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('mandatory_field_catalog')
export class MandatoryFieldCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'field_key', unique: true, length: 50 })
  fieldKey: string;

  @Column({ name: 'label_ar', length: 150 })
  labelAr: string;

  @Column({ name: 'zatca_required', default: true })
  zatcaRequired: boolean;

  @Column({ name: 'warning_message', type: 'text' })
  warningMessage: string;
}
