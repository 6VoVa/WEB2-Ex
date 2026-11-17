import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Bălți', minLength: 1, maxLength: 160 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 160)
  name: string;

  @ApiPropertyOptional({
    example: 'city',
    description: 'Settlement type (city, town, village, etc.)',
    default: 'city',
    maxLength: 40,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;

  @ApiPropertyOptional({ example: 102457, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  population?: number;

  @ApiProperty({ example: 10, description: 'Existing region id', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  regionId: number;
}
