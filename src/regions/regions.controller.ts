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
import { Location } from '../locations/entities/location.entity';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Region } from './entities/region.entity';
import { RegionsService } from './regions.service';

@ApiTags('Regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a region inside an existing country' })
  @ApiBody({ type: CreateRegionDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Region created', type: Region })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Parent country not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Region code already exists' })
  create(@Body() createRegionDto: CreateRegionDto): Promise<Region> {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all regions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of regions', type: [Region] })
  findAll(): Promise<Region[]> {
    return this.regionsService.findAll();
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'List all locations of a region' })
  @ApiParam({ name: 'id', description: 'Region id', example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Locations of the region', type: [Location] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Region not found' })
  findLocations(@Param('id', ParseIntPipe) id: number): Promise<Location[]> {
    return this.regionsService.findLocations(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a region by id' })
  @ApiParam({ name: 'id', description: 'Region id', example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Region found', type: Region })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Region not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Region> {
    return this.regionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a region' })
  @ApiParam({ name: 'id', description: 'Region id', example: 10 })
  @ApiBody({ type: UpdateRegionDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Region updated', type: Region })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Region or parent country not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Region code already exists' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegionDto: UpdateRegionDto,
  ): Promise<Region> {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a region and its locations' })
  @ApiParam({ name: 'id', description: 'Region id', example: 10 })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Region deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Region not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.regionsService.remove(id);
  }
}
