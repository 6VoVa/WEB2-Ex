import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Country } from './entities/country.entity';
import { Region } from '../regions/entities/region.entity';
import { Location } from '../locations/entities/location.entity';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a country' })
  @ApiBody({ type: CreateCountryDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Country created', type: Country })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Country code already exists' })
  create(@Body() createCountryDto: CreateCountryDto): Promise<Country> {
    return this.countriesService.create(createCountryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all countries' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of countries', type: [Country] })
  findAll(): Promise<Country[]> {
    return this.countriesService.findAll();
  }

  @Get(':id/regions')
  @ApiOperation({ summary: 'List all regions of a country' })
  @ApiParam({ name: 'id', description: 'Country id', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Regions of the country', type: [Region] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Country not found' })
  findRegions(@Param('id', ParseIntPipe) id: number): Promise<Region[]> {
    return this.countriesService.findRegions(id);
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'List all locations of a country across its regions' })
  @ApiParam({ name: 'id', description: 'Country id', example: 1 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Locations in all regions of the country, joined through region',
    type: [Location],
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Country not found' })
  findLocations(@Param('id', ParseIntPipe) id: number): Promise<Location[]> {
    return this.countriesService.findLocations(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by id' })
  @ApiParam({ name: 'id', description: 'Country id', example: 1 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Country found', type: Country })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Country not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Country> {
    return this.countriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a country' })
  @ApiParam({ name: 'id', description: 'Country id', example: 1 })
  @ApiBody({ type: UpdateCountryDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Country updated', type: Country })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Country not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Country code already exists' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCountryDto: UpdateCountryDto,
  ): Promise<Country> {
    return this.countriesService.update(id, updateCountryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a country and its regions and locations' })
  @ApiParam({ name: 'id', description: 'Country id', example: 1 })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Country deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Country not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.countriesService.remove(id);
  }
}
