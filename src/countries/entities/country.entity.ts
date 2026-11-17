import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Region } from '../../regions/entities/region.entity';

@Entity({ name: 'countries' })
export class Country {
  @ApiProperty({ example: 1, description: 'Auto-generated primary key' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Moldova', maxLength: 120 })
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ApiProperty({ example: 'MD', description: 'ISO 3166-1 alpha-2/alpha-3 country code' })
  @Column({ type: 'varchar', length: 3, unique: true })
  code: string;

  @ApiProperty({ type: () => [Region], description: 'Regions belonging to this country' })
  @OneToMany(() => Region, (region) => region.country)
  regions: Region[];

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', readOnly: true })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', readOnly: true })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
