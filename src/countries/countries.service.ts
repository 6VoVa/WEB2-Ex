import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { Region } from '../regions/entities/region.entity';
import { Location } from '../locations/entities/location.entity';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createCountryDto: CreateCountryDto): Promise<Country> {
    await this.ensureCodeIsAvailable(createCountryDto.code);

    const country = this.countryRepository.create(createCountryDto);
    return this.countryRepository.save(country);
  }

  findAll(): Promise<Country[]> {
    return this.countryRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Country> {
    const country = await this.countryRepository.findOne({ where: { id } });
    if (!country) {
      throw new NotFoundException(`Country with id ${id} was not found`);
    }
    return country;
  }

  async update(id: number, updateCountryDto: UpdateCountryDto): Promise<Country> {
    const country = await this.findOne(id);

    if (updateCountryDto.code && updateCountryDto.code !== country.code) {
      await this.ensureCodeIsAvailable(updateCountryDto.code, id);
    }

    Object.assign(country, updateCountryDto);
    return this.countryRepository.save(country);
  }

  async remove(id: number): Promise<void> {
    const country = await this.findOne(id);
    await this.countryRepository.remove(country);
  }

  async findRegions(countryId: number): Promise<Region[]> {
    await this.findOne(countryId);

    return this.regionRepository.find({
      where: { countryId },
      order: { name: 'ASC' },
    });
  }

  async findLocations(countryId: number): Promise<Location[]> {
    await this.findOne(countryId);

    return this.locationRepository
      .createQueryBuilder('location')
      .innerJoinAndSelect('location.region', 'region')
      .where('region.countryId = :countryId', { countryId })
      .orderBy('region.name', 'ASC')
      .addOrderBy('location.name', 'ASC')
      .getMany();
  }

  private async ensureCodeIsAvailable(code: string, exceptId?: number): Promise<void> {
    const existing = await this.countryRepository.findOne({ where: { code } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(`Country with code ${code} already exists`);
    }
  }
}
