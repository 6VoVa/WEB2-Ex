import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from '../regions/entities/region.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    await this.ensureRegionExists(createLocationDto.regionId);

    const location = this.locationRepository.create(createLocationDto);
    return this.locationRepository.save(location);
  }

  findAll(): Promise<Location[]> {
    return this.locationRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: { region: { country: true } },
    });
    if (!location) {
      throw new NotFoundException(`Location with id ${id} was not found`);
    }
    return location;
  }

  async update(id: number, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    if (updateLocationDto.regionId) {
      await this.ensureRegionExists(updateLocationDto.regionId);
      if (updateLocationDto.regionId !== location.regionId) {
        location.region = { id: updateLocationDto.regionId } as Region;
      }
    }

    Object.assign(location, updateLocationDto);
    return this.locationRepository.save(location);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await this.locationRepository.remove(location);
  }

  private async ensureRegionExists(regionId: number): Promise<void> {
    const exists = await this.regionRepository.exists({ where: { id: regionId } });
    if (!exists) {
      throw new NotFoundException(`Region with id ${regionId} was not found`);
    }
  }
}
