import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../countries/entities/country.entity';
import { Location } from '../locations/entities/location.entity';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Region } from './entities/region.entity';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createRegionDto: CreateRegionDto): Promise<Region> {
    await this.ensureCountryExists(createRegionDto.countryId);
    await this.ensureCodeIsAvailable(createRegionDto.countryId, createRegionDto.code);

    const region = this.regionRepository.create(createRegionDto);
    return this.regionRepository.save(region);
  }

  findAll(): Promise<Region[]> {
    return this.regionRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Region> {
    const region = await this.regionRepository.findOne({
      where: { id },
      relations: { country: true },
    });
    if (!region) {
      throw new NotFoundException(`Region with id ${id} was not found`);
    }
    return region;
  }

  async update(id: number, updateRegionDto: UpdateRegionDto): Promise<Region> {
    const region = await this.findOne(id);
    const countryId = updateRegionDto.countryId ?? region.countryId;
    const code = updateRegionDto.code ?? region.code;

    if (updateRegionDto.countryId) {
      await this.ensureCountryExists(updateRegionDto.countryId);
      if (updateRegionDto.countryId !== region.countryId) {
        region.country = { id: updateRegionDto.countryId } as Country;
      }
    }
    if (countryId !== region.countryId || code !== region.code) {
      await this.ensureCodeIsAvailable(countryId, code, id);
    }

    Object.assign(region, updateRegionDto);
    return this.regionRepository.save(region);
  }

  async remove(id: number): Promise<void> {
    const region = await this.findOne(id);
    await this.regionRepository.remove(region);
  }

  async findLocations(regionId: number): Promise<Location[]> {
    await this.findOne(regionId);

    return this.locationRepository.find({
      where: { regionId },
      order: { name: 'ASC' },
    });
  }

  private async ensureCountryExists(countryId: number): Promise<void> {
    const exists = await this.countryRepository.exists({ where: { id: countryId } });
    if (!exists) {
      throw new NotFoundException(`Country with id ${countryId} was not found`);
    }
  }

  private async ensureCodeIsAvailable(
    countryId: number,
    code: string,
    exceptId?: number,
  ): Promise<void> {
    const existing = await this.regionRepository.findOne({
      where: { countryId, code },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `Region with code ${code} already exists in country ${countryId}`,
      );
    }
  }
}
