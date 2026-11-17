import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Min } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Centre', minLength: 2, maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({
    example: 'CE',
    description: 'Short region code, unique inside the country',
    minLength: 1,
    maxLength: 8,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : (value as string),
  )
  @IsString()
  @Matches(/^[A-Z0-9-]{1,8}$/, {
    message: 'code must contain 1 to 8 uppercase Latin letters, digits or dashes',
  })
  code: string;

  @ApiProperty({ example: 1, description: 'Existing country id', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  countryId: number;
}
