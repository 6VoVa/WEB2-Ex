import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'Moldova', minLength: 2, maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({
    example: 'MD',
    description: 'ISO 3166-1 alpha-2 or alpha-3 code',
    minLength: 2,
    maxLength: 3,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : (value as string),
  )
  @IsString()
  @Matches(/^[A-Z]{2,3}$/, { message: 'code must contain 2 or 3 Latin letters' })
  code: string;
}
