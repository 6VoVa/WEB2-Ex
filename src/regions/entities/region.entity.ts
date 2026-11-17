import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Country } from '../../countries/entities/country.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity({ name: 'regions' })
@Index('UQ_regions_country_code', ['countryId', 'code'], { unique: true })
export class Region {
  @ApiProperty({ example: 10, description: 'Auto-generated primary key' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Centre', maxLength: 120 })
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ApiProperty({ example: 'CE', description: 'Region code, unique inside its country' })
  @Column({ type: 'varchar', length: 8 })
  code: string;

  @ApiProperty({ example: 1, description: 'Foreign key to countries.id' })
  @Column({ type: 'int' })
  countryId: number;

  @ApiProperty({ type: () => Country, description: 'Parent country' })
  @ManyToOne(() => Country, (country) => country.regions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @ApiProperty({ type: () => [Location], description: 'Locations inside this region' })
  @OneToMany(() => Location, (location) => location.region)
  locations: Location[];

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', readOnly: true })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', readOnly: true })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
