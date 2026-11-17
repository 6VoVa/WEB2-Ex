import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Region } from '../../regions/entities/region.entity';

@Entity({ name: 'locations' })
export class Location {
  @ApiProperty({ example: 100, description: 'Auto-generated primary key' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Bălți', maxLength: 160 })
  @Column({ type: 'varchar', length: 160 })
  name: string;

  @ApiProperty({
    example: 'city',
    description: 'Settlement type, for example city, town or village',
    maxLength: 40,
  })
  @Column({ type: 'varchar', length: 40, default: 'city' })
  type: string;

  @ApiProperty({ example: 102457, minimum: 0, default: 0 })
  @Column({ type: 'int', default: 0 })
  population: number;

  @ApiProperty({ example: 10, description: 'Foreign key to regions.id' })
  @Column({ type: 'int' })
  regionId: number;

  @ApiProperty({ type: () => Region, description: 'Parent region' })
  @ManyToOne(() => Region, (region) => region.locations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'regionId' })
  region: Region;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', readOnly: true })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', readOnly: true })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
