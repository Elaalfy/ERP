import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';

@Entity('journal_entry_lines')
@Check(`"debit" = 0 OR "credit" = 0`)
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JournalEntry, (entry) => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry: JournalEntry;

  @Column({ name: 'journal_entry_id' })
  journalEntryId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  credit: number;

  @Column({ name: 'line_note', type: 'text', nullable: true })
  lineNote: string;
}
